import torch
import torch.nn as nn
import tempfile
import os
import torchaudio
from TTS.tts.layers.xtts.dvae import DiscreteVAE
from TTS.tts.layers.tortoise.arch_utils import TorchMelSpectrogram
from model.core.adapters.valence_arousal_adapter import ValenceArousalAdapter
from model.utils.device_utils import *
from model.utils.model_utils import *


class ValenceArousalXTTS(nn.Module):
    def __init__(self, config_path=None, checkpoint_path=None, local_model_dir="./models/xtts_v2"):
        super().__init__()

        self.local_model_dir = local_model_dir

        print("Loading XTTS model...")

        try:
            self.xtts, self.config = load_xtts_model(
                config_path=config_path,
                checkpoint_path=checkpoint_path,
                local_model_dir=local_model_dir
            )
            print("Loaded XTTS from local directory")

        except Exception as e:
            print(f"Local model not found: {e}")
            print("Falling back to TTS API...")

            try:
                from TTS.api import TTS
                # Disable progress bar to avoid download issues with proxy
                tts_api = TTS("tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False)
                self.xtts = tts_api.synthesizer.tts_model
                self.config = self.xtts.config
                print("Loaded XTTS via TTS API")
            except Exception as api_error:
                raise RuntimeError(f"Failed to load XTTS via both local and API methods: {api_error}")

        verify_xtts_components(self.xtts)

        latent_dim = self.config.model_args.gpt_n_model_channels
        self.va_adapter = ValenceArousalAdapter(
            emotion_dim=256,
            latent_dim=latent_dim
        )

        freeze_model_parameters(self.xtts, freeze=True)

        self.dvae = None
        self.mel_converter = None
        self._init_dvae_and_mel_converter()

        print("ValenceArousalXTTS initialization complete!")

    def to(self, device):
        """
        Move model to device with hybrid MPS/CPU strategy
        """
        super().to(device)
        self.primary_device = device

        if hasattr(self, 'xtts'):
            self.xtts = move_model_to_device(self.xtts, device)

        if hasattr(self, 'va_adapter'):
            self.va_adapter = self.va_adapter.to(device)

        # Handle DVAE with potential CPU fallback for MPS
        if hasattr(self, 'dvae') and self.dvae is not None:
            try:
                self.dvae = self.dvae.to(device)
                self.dvae_device = device
                print(f"✅ DVAE on {device}")
            except Exception as e:
                if str(device).startswith('mps'):
                    print(f"⚠️  DVAE incompatible with MPS, using CPU fallback: {e}")
                    self.dvae = self.dvae.to(torch.device('cpu'))
                    self.dvae_device = torch.device('cpu')
                else:
                    raise e

        # Handle mel converter with potential CPU fallback for MPS
        if hasattr(self, 'mel_converter') and self.mel_converter is not None:
            try:
                self.mel_converter = self.mel_converter.to(device)
                self.mel_device = device
                print(f"✅ Mel converter on {device}")
            except Exception as e:
                if str(device).startswith('mps'):
                    print(f"⚠️  Mel converter incompatible with MPS, using CPU fallback: {e}")
                    self.mel_converter = self.mel_converter.to(torch.device('cpu'))
                    self.mel_device = torch.device('cpu')
                else:
                    raise e

        return self

    def cuda(self, device=None):
        """
        Move model to CUDA device (legacy method)
        """
        if device is None:
            device = torch.device('cuda')
        return self.to(device)

    def mps(self):
        """
        Move model to MPS device (Apple Silicon GPU)
        """
        return self.to(torch.device('mps'))

    def auto_device(self):
        """
        Automatically select and move to optimal device
        """
        optimal_device = get_optimal_device()
        return self.to(optimal_device)

    def get_device_status(self):
        """
        Get current device status for all components
        """
        return {
            "primary_device": str(self.primary_device),
            "dvae_device": str(self.dvae_device) if self.dvae_device else None,
            "mel_device": str(self.mel_device) if self.mel_device else None,
            "xtts_device": str(next(self.xtts.parameters()).device) if hasattr(self, 'xtts') else None,
            "adapter_device": str(next(self.va_adapter.parameters()).device) if hasattr(self, 'va_adapter') else None
        }

    def _init_dvae_and_mel_converter(self):
        try:
            dvae_path = os.path.join(self.local_model_dir, "dvae.pth")
            mel_stats_path = os.path.join(self.local_model_dir, "mel_stats.pth")

            if not os.path.exists(dvae_path):
                print(f"Error: dvae.pth not found at {dvae_path}")
                return

            if not os.path.exists(mel_stats_path):
                print(f"Error: mel_stats.pth not found at {mel_stats_path}")
                return

            self.dvae = DiscreteVAE(
                channels=80, normalization=None, positional_dims=1, num_tokens=1024,
                codebook_dim=512, hidden_dim=512, num_resnet_blocks=3, kernel_size=3,
                num_layers=2, use_transposed_convs=False,
            )

            self.dvae.load_state_dict(torch.load(dvae_path, map_location='cpu'), strict=False)
            self.dvae.eval()

            self.mel_converter = TorchMelSpectrogram(
                mel_norm_file=mel_stats_path,
                sampling_rate=22050
            )

            print("✅ DVAE and mel converter initialized successfully")

        except Exception as e:
            print(f"❌ Error initializing DVAE and mel converter: {e}")
            self.dvae = None
            self.mel_converter = None

    def extract_dvae_tokens(self, audio_tensor):
        try:
            if self.dvae is None or self.mel_converter is None:
                raise RuntimeError("DVAE or mel converter not initialized. Check dvae.pth and mel_stats.pth paths.")

            device = next(self.parameters()).device

            if audio_tensor.dim() == 1:
                audio_tensor = audio_tensor.unsqueeze(0)  # Add channel dim
            audio_tensor = audio_tensor.to(device)

            mel = self.mel_converter(audio_tensor.unsqueeze(0))  # Add batch dim for mel converter

            remainder = mel.shape[-1] % 4
            if remainder:
                mel = mel[:, :, :-remainder]

            with torch.no_grad():
                tokens = self.dvae.get_codebook_indices(mel)
                return tokens.squeeze(0)  # Remove batch dim

        except Exception as e:
            print(f"Error extracting DVAE tokens: {e}")
            return None

    def extract_dvae_tokens_batch(self, audio_batch):
        try:
            if self.dvae is None or self.mel_converter is None:
                raise RuntimeError("DVAE or mel converter not initialized. Check dvae.pth and mel_stats.pth paths.")

            tokens_list = []
            failed_samples = []

            for i, audio in enumerate(audio_batch):
                tokens = self.extract_dvae_tokens(audio)
                if tokens is not None:
                    tokens_list.append(tokens)
                else:
                    failed_samples.append(i)

            if failed_samples:
                raise ValueError(f"Token extraction failed for samples: {failed_samples}. Cannot train with incomplete ground truth.")

            return tokens_list

        except Exception as e:
            print(f"CRITICAL: Batch token extraction failed: {e}")
            raise e

    def get_conditioning_latents_with_valence_arousal(self, audio_input, valence, arousal, training=False):
        device = next(self.parameters()).device

        temp_path = None
        try:
            if training and isinstance(audio_input, torch.Tensor):
                audio_input = prepare_audio_tensor(audio_input)
                temp_path = create_temp_audio_file(audio_input)
                audio_path_for_xtts = [temp_path]

            elif isinstance(audio_input, (str, list)):
                audio_path_for_xtts = audio_input if isinstance(audio_input, list) else [audio_input]
            else:
                raise ValueError(f"Unsupported audio_input type: {type(audio_input)}")

            if training:
                original_gpt_cond_latent, original_speaker_embedding = self.xtts.get_conditioning_latents(
                    audio_path=audio_path_for_xtts
                )
            else:
                with torch.no_grad():
                    original_gpt_cond_latent, original_speaker_embedding = self.xtts.get_conditioning_latents(
                        audio_path=audio_path_for_xtts
                    )

        finally:
            if temp_path is not None:
                cleanup_temp_file(temp_path)

        original_gpt_cond_latent = original_gpt_cond_latent.to(device)
        original_speaker_embedding = original_speaker_embedding.to(device)

        if not isinstance(valence, torch.Tensor):
            valence = torch.tensor(valence, dtype=torch.float32, device=device)
        else:
            valence = valence.to(device)

        if not isinstance(arousal, torch.Tensor):
            arousal = torch.tensor(arousal, dtype=torch.float32, device=device)
        else:
            arousal = arousal.to(device)

        emotion_gpt_latent, emotion_speaker_embedding = self.va_adapter(
            original_gpt_cond_latent, original_speaker_embedding, valence, arousal
        )

        return emotion_gpt_latent, emotion_speaker_embedding

    def inference_with_valence_arousal(self, text, language, audio_path, valence, arousal, **kwargs):
        if language not in DEFAULT_XTTS_CONFIG["supported_languages"]:
            language = "en"

        print(f"Generating speech with valence: {valence}, arousal: {arousal}")

        try:
            gpt_cond_latent, speaker_embedding = self.get_conditioning_latents_with_valence_arousal(
                audio_path, valence, arousal, training=False
            )

            if gpt_cond_latent.dim() == 2:
                gpt_cond_latent = gpt_cond_latent.unsqueeze(0)
            elif gpt_cond_latent.dim() == 4:
                gpt_cond_latent = gpt_cond_latent.squeeze(0)

            print(f"GPT latent shape: {gpt_cond_latent.shape}")
            print(f"Speaker embedding shape: {speaker_embedding.shape}")

            assert gpt_cond_latent.dim() == 3, f"GPT latent should be 3D, got {gpt_cond_latent.dim()}D: {gpt_cond_latent.shape}"

            return self.xtts.inference(
                text,
                language,
                gpt_cond_latent,
                speaker_embedding,
                **kwargs
            )
        except Exception as e:
            print(f"Error during inference: {e}")
            print(f"GPT latent shape: {gpt_cond_latent.shape if 'gpt_cond_latent' in locals() else 'undefined'}")
            print(f"Speaker embedding shape: {speaker_embedding.shape if 'speaker_embedding' in locals() else 'undefined'}")
            raise e

    def unfreeze_valence_arousal_adapter(self):
        freeze_model_parameters(self.va_adapter, freeze=False)
        print("Valence-arousal adapter unfrozen for training")

    def unfreeze_last_n_gpt_layers(self, n=2):
        gpt_layers = self.xtts.gpt.gpt.layers

        for layer in gpt_layers[-n:]:
            freeze_model_parameters(layer, freeze=False)

        print(f"Last {n} GPT layers unfrozen for fine-tuning")

    def get_model_info(self):
        base_info = get_model_info(self.xtts, self.config, self.local_model_dir)

        va_info = {
            "va_adapter_params": sum(p.numel() for p in self.va_adapter.parameters()),
            "va_adapter_trainable": sum(p.numel() for p in self.va_adapter.parameters() if p.requires_grad),
            "supported_languages": DEFAULT_XTTS_CONFIG["supported_languages"]
        }

        device_info = get_device_info()

        return {**base_info, **va_info, "device_info": device_info}

    def save_valence_arousal_adapter(self, save_path):
        torch.save({
            'va_adapter_state_dict': self.va_adapter.state_dict()
        }, save_path)
        print(f"Valence-arousal adapter saved to {save_path}")

    def load_valence_arousal_adapter(self, load_path):
        checkpoint = torch.load(load_path, map_location=next(self.parameters()).device)
        self.va_adapter.load_state_dict(checkpoint['va_adapter_state_dict'])
        print(f"Valence-arousal adapter loaded from {load_path}")
