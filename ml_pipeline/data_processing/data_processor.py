"""
Data Processing Pipeline for Audio ML Models
This module handles:
- Audio file preprocessing
- Feature extraction
- Data augmentation
- Dataset preparation for training
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import librosa
import soundfile as sf
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import pickle
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import yaml

from ..pipeline_utils import GCPConfig, StorageManager, PipelineStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioPreprocessor:
    """Handles audio preprocessing and feature extraction"""
    
    def __init__(self, 
                 sample_rate: int = 22050,
                 n_fft: int = 2048,
                 hop_length: int = 512,
                 n_mels: int = 80,
                 max_duration: float = 30.0,
                 min_duration: float = 1.0):
        self.sample_rate = sample_rate
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.n_mels = n_mels
        self.max_duration = max_duration
        self.min_duration = min_duration
        
        logger.info(f"AudioPreprocessor initialized with sample_rate={sample_rate}, "
                   f"n_mels={n_mels}, max_duration={max_duration}s")
    
    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """Load audio file and resample if necessary"""
        try:
            audio, sr = librosa.load(file_path, sr=self.sample_rate)
            return audio, sr
        except Exception as e:
            logger.error(f"Failed to load audio file {file_path}: {e}")
            raise
    
    def validate_audio_duration(self, audio: np.ndarray) -> bool:
        """Validate audio duration is within acceptable range"""
        duration = len(audio) / self.sample_rate
        return self.min_duration <= duration <= self.max_duration
    
    def trim_or_pad_audio(self, audio: np.ndarray, target_length: Optional[int] = None) -> np.ndarray:
        """Trim or pad audio to target length"""
        if target_length is None:
            target_length = int(self.max_duration * self.sample_rate)
        
        if len(audio) > target_length:
            # Trim audio
            audio = audio[:target_length]
        elif len(audio) < target_length:
            # Pad audio with zeros
            padding = target_length - len(audio)
            audio = np.pad(audio, (0, padding), mode='constant', constant_values=0)
        
        return audio
    
    def normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        """Normalize audio to [-1, 1] range"""
        if np.max(np.abs(audio)) > 0:
            audio = audio / np.max(np.abs(audio))
        return audio
    
    def extract_mel_spectrogram(self, audio: np.ndarray) -> np.ndarray:
        """Extract mel spectrogram features"""
        try:
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels
            )
            
            # Convert to log scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            return mel_spec_db
        except Exception as e:
            logger.error(f"Failed to extract mel spectrogram: {e}")
            raise
    
    def extract_mfcc(self, audio: np.ndarray, n_mfcc: int = 13) -> np.ndarray:
        """Extract MFCC features"""
        try:
            mfcc = librosa.feature.mfcc(
                y=audio,
                sr=self.sample_rate,
                n_mfcc=n_mfcc,
                n_fft=self.n_fft,
                hop_length=self.hop_length
            )
            return mfcc
        except Exception as e:
            logger.error(f"Failed to extract MFCC: {e}")
            raise
    
    def extract_spectral_features(self, audio: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract various spectral features"""
        try:
            features = {}
            
            # Spectral centroid
            features['spectral_centroid'] = librosa.feature.spectral_centroid(
                y=audio, sr=self.sample_rate, hop_length=self.hop_length)[0]
            
            # Spectral rolloff
            features['spectral_rolloff'] = librosa.feature.spectral_rolloff(
                y=audio, sr=self.sample_rate, hop_length=self.hop_length)[0]
            
            # Zero crossing rate
            features['zero_crossing_rate'] = librosa.feature.zero_crossing_rate(
                audio, hop_length=self.hop_length)[0]
            
            # Spectral contrast
            features['spectral_contrast'] = librosa.feature.spectral_contrast(
                y=audio, sr=self.sample_rate, hop_length=self.hop_length)
            
            # Tonnetz (harmonic network)
            features['tonnetz'] = librosa.feature.tonnetz(
                y=audio, sr=self.sample_rate, hop_length=self.hop_length)
            
            return features
        except Exception as e:
            logger.error(f"Failed to extract spectral features: {e}")
            raise
    
    def process_audio_file(self, file_path: str) -> Dict[str, Any]:
        """Process single audio file and extract all features"""
        try:
            # Load audio
            audio, sr = self.load_audio(file_path)
            
            # Validate duration
            if not self.validate_audio_duration(audio):
                logger.warning(f"Audio duration out of range: {file_path}")
                return None
            
            # Normalize audio
            audio = self.normalize_audio(audio)
            
            # Trim or pad to consistent length
            audio = self.trim_or_pad_audio(audio)
            
            # Extract features
            features = {
                'file_path': file_path,
                'audio_data': audio,
                'sample_rate': sr,
                'duration': len(audio) / sr,
                'mel_spectrogram': self.extract_mel_spectrogram(audio),
                'mfcc': self.extract_mfcc(audio),
                'spectral_features': self.extract_spectral_features(audio)
            }
            
            return features
        except Exception as e:
            logger.error(f"Failed to process audio file {file_path}: {e}")
            return None

class DataAugmentation:
    """Handles data augmentation for audio training data"""
    
    def __init__(self, sample_rate: int = 22050):
        self.sample_rate = sample_rate
        logger.info("DataAugmentation initialized")
    
    def add_noise(self, audio: np.ndarray, noise_level: float = 0.005) -> np.ndarray:
        """Add random noise to audio"""
        noise = np.random.normal(0, noise_level, audio.shape)
        return audio + noise
    
    def time_stretch(self, audio: np.ndarray, rate: float = 1.0) -> np.ndarray:
        """Time stretch audio without changing pitch"""
        try:
            return librosa.effects.time_stretch(audio, rate=rate)
        except Exception as e:
            logger.warning(f"Time stretch failed: {e}")
            return audio
    
    def pitch_shift(self, audio: np.ndarray, n_steps: float = 0.0) -> np.ndarray:
        """Pitch shift audio without changing duration"""
        try:
            return librosa.effects.pitch_shift(audio, sr=self.sample_rate, n_steps=n_steps)
        except Exception as e:
            logger.warning(f"Pitch shift failed: {e}")
            return audio
    
    def apply_random_augmentation(self, audio: np.ndarray) -> np.ndarray:
        """Apply random augmentation to audio"""
        augmented = audio.copy()
        
        # Random noise (50% chance)
        if random.random() < 0.5:
            noise_level = random.uniform(0.001, 0.01)
            augmented = self.add_noise(augmented, noise_level)
        
        # Random time stretch (30% chance)
        if random.random() < 0.3:
            rate = random.uniform(0.8, 1.2)
            augmented = self.time_stretch(augmented, rate)
        
        # Random pitch shift (30% chance)
        if random.random() < 0.3:
            n_steps = random.uniform(-2, 2)
            augmented = self.pitch_shift(augmented, n_steps)
        
        return augmented

class DataProcessor:
    """Main data processing pipeline"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.gcp_config = GCPConfig()
        self.storage_manager = StorageManager(self.gcp_config)
        self.pipeline_status = PipelineStatus(self.gcp_config)
        
        # Initialize preprocessor and augmentation
        self.preprocessor = AudioPreprocessor(
            sample_rate=config['data_processing']['sample_rate'],
            max_duration=config['data_processing']['max_duration'],
            min_duration=config['data_processing']['min_duration']
        )
        
        self.augmentation = DataAugmentation(
            sample_rate=config['data_processing']['sample_rate']
        )
        
        logger.info("DataProcessor initialized")
    
    def download_raw_data(self, pipeline_id: str) -> List[str]:
        """Download raw audio data from GCS"""
        try:
            self.pipeline_status.update_status(
                pipeline_id, "running", 0.1, "Downloading raw data"
            )
            
            raw_bucket = self.gcp_config.buckets['raw_data']
            audio_files = self.storage_manager.list_files(raw_bucket)
            
            # Filter for audio files
            audio_extensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg']
            audio_files = [f for f in audio_files 
                          if any(f.lower().endswith(ext) for ext in audio_extensions)]
            
            # Download files to local temp directory
            local_files = []
            temp_dir = "/tmp/raw_audio"
            os.makedirs(temp_dir, exist_ok=True)
            
            for i, file_name in enumerate(audio_files):
                local_path = os.path.join(temp_dir, os.path.basename(file_name))
                self.storage_manager.download_file(raw_bucket, file_name, local_path)
                local_files.append(local_path)
                
                # Update progress
                progress = 0.1 + (i / len(audio_files)) * 0.2
                self.pipeline_status.update_status(
                    pipeline_id, "running", progress, 
                    f"Downloaded {i+1}/{len(audio_files)} files"
                )
            
            logger.info(f"Downloaded {len(local_files)} audio files")
            return local_files
            
        except Exception as e:
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.1, f"Failed to download raw data: {e}"
            )
            raise
    
    def process_audio_files(self, audio_files: List[str], pipeline_id: str) -> List[Dict[str, Any]]:
        """Process audio files in parallel"""
        try:
            self.pipeline_status.update_status(
                pipeline_id, "running", 0.3, "Processing audio files"
            )
            
            processed_data = []
            
            # Process files in parallel
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    executor.submit(self.preprocessor.process_audio_file, file_path): file_path 
                    for file_path in audio_files
                }
                
                for i, future in enumerate(as_completed(futures)):
                    try:
                        result = future.result()
                        if result is not None:
                            processed_data.append(result)
                        
                        # Update progress
                        progress = 0.3 + (i / len(audio_files)) * 0.4
                        self.pipeline_status.update_status(
                            pipeline_id, "running", progress,
                            f"Processed {i+1}/{len(audio_files)} files"
                        )
                        
                    except Exception as e:
                        file_path = futures[future]
                        logger.error(f"Failed to process {file_path}: {e}")
            
            logger.info(f"Successfully processed {len(processed_data)}/{len(audio_files)} files")
            return processed_data
            
        except Exception as e:
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.3, f"Failed to process audio files: {e}"
            )
            raise
    
    def augment_data(self, processed_data: List[Dict[str, Any]], pipeline_id: str) -> List[Dict[str, Any]]:
        """Apply data augmentation"""
        try:
            if not self.config['data_processing']['augmentation'].get('enabled', True):
                logger.info("Data augmentation disabled, skipping")
                return processed_data
            
            self.pipeline_status.update_status(
                pipeline_id, "running", 0.7, "Applying data augmentation"
            )
            
            augmented_data = []
            
            for i, data in enumerate(processed_data):
                # Add original data
                augmented_data.append(data)
                
                # Create augmented versions
                audio = data['audio_data']
                
                # Apply different augmentations
                augmentations = [
                    self.augmentation.add_noise(audio, 0.005),
                    self.augmentation.time_stretch(audio, 1.1),
                    self.augmentation.pitch_shift(audio, 1.0),
                ]
                
                for j, aug_audio in enumerate(augmentations):
                    if aug_audio is not None:
                        aug_data = data.copy()
                        aug_data['audio_data'] = aug_audio
                        aug_data['file_path'] = f"{data['file_path']}_aug_{j}"
                        aug_data['augmented'] = True
                        
                        # Re-extract features for augmented audio
                        aug_data['mel_spectrogram'] = self.preprocessor.extract_mel_spectrogram(aug_audio)
                        aug_data['mfcc'] = self.preprocessor.extract_mfcc(aug_audio)
                        aug_data['spectral_features'] = self.preprocessor.extract_spectral_features(aug_audio)
                        
                        augmented_data.append(aug_data)
                
                # Update progress
                progress = 0.7 + (i / len(processed_data)) * 0.15
                self.pipeline_status.update_status(
                    pipeline_id, "running", progress,
                    f"Augmented {i+1}/{len(processed_data)} files"
                )
            
            logger.info(f"Data augmentation complete: {len(processed_data)} -> {len(augmented_data)} samples")
            return augmented_data
            
        except Exception as e:
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.7, f"Failed to augment data: {e}"
            )
            raise
    
    def prepare_dataset(self, processed_data: List[Dict[str, Any]], pipeline_id: str) -> Dict[str, Any]:
        """Prepare final dataset for training"""
        try:
            self.pipeline_status.update_status(
                pipeline_id, "running", 0.85, "Preparing dataset"
            )
            
            # Extract features and labels
            features = []
            labels = []
            metadata = []
            
            for data in processed_data:
                # Combine all features
                feature_vector = np.concatenate([
                    data['mel_spectrogram'].flatten(),
                    data['mfcc'].flatten(),
                    data['spectral_features']['spectral_centroid'].flatten(),
                    data['spectral_features']['spectral_rolloff'].flatten(),
                    data['spectral_features']['zero_crossing_rate'].flatten(),
                ])
                
                features.append(feature_vector)
                
                # Extract label from filename or metadata (placeholder)
                label = self._extract_label_from_filename(data['file_path'])
                labels.append(label)
                
                metadata.append({
                    'file_path': data['file_path'],
                    'duration': data['duration'],
                    'augmented': data.get('augmented', False)
                })
            
            # Convert to numpy arrays
            features = np.array(features)
            labels = np.array(labels)
            
            # Normalize features
            scaler = StandardScaler()
            features_normalized = scaler.fit_transform(features)
            
            # Train/validation split
            X_train, X_val, y_train, y_val, meta_train, meta_val = train_test_split(
                features_normalized, labels, metadata,
                test_size=self.config['training']['validation_split'],
                random_state=42,
                stratify=labels
            )
            
            dataset = {
                'X_train': X_train,
                'X_val': X_val,
                'y_train': y_train,
                'y_val': y_val,
                'metadata_train': meta_train,
                'metadata_val': meta_val,
                'scaler': scaler,
                'feature_names': self._get_feature_names(),
                'label_mapping': self._get_label_mapping(),
                'dataset_stats': {
                    'total_samples': len(features),
                    'training_samples': len(X_train),
                    'validation_samples': len(X_val),
                    'feature_dim': features.shape[1],
                    'num_classes': len(np.unique(labels))
                }
            }
            
            logger.info(f"Dataset prepared: {dataset['dataset_stats']}")
            return dataset
            
        except Exception as e:
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.85, f"Failed to prepare dataset: {e}"
            )
            raise
    
    def save_processed_data(self, dataset: Dict[str, Any], pipeline_id: str) -> str:
        """Save processed dataset to GCS"""
        try:
            self.pipeline_status.update_status(
                pipeline_id, "running", 0.95, "Saving processed data"
            )
            
            # Save dataset to local file
            dataset_path = f"/tmp/processed_dataset_{pipeline_id}.pkl"
            with open(dataset_path, 'wb') as f:
                pickle.dump(dataset, f)
            
            # Upload to GCS
            processed_bucket = self.gcp_config.buckets['processed_data']
            blob_name = f"datasets/processed_dataset_{pipeline_id}.pkl"
            gcs_path = self.storage_manager.upload_file(
                processed_bucket, dataset_path, blob_name
            )
            
            # Save metadata
            metadata_path = f"/tmp/dataset_metadata_{pipeline_id}.json"
            with open(metadata_path, 'w') as f:
                json.dump(dataset['dataset_stats'], f, indent=2)
            
            metadata_blob = f"datasets/metadata_{pipeline_id}.json"
            self.storage_manager.upload_file(
                processed_bucket, metadata_path, metadata_blob
            )
            
            # Clean up local files
            os.remove(dataset_path)
            os.remove(metadata_path)
            
            logger.info(f"Processed dataset saved to: {gcs_path}")
            return gcs_path
            
        except Exception as e:
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.95, f"Failed to save processed data: {e}"
            )
            raise
    
    def _extract_label_from_filename(self, filename: str) -> str:
        """Extract label from filename (placeholder implementation)"""
        # This would be customized based on your dataset structure
        # For now, return a placeholder label
        return "default_label"
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names for the dataset"""
        # This would return the actual feature names based on your extraction
        return ["mel_spectrogram", "mfcc", "spectral_features"]
    
    def _get_label_mapping(self) -> Dict[str, int]:
        """Get label to integer mapping"""
        # This would return the actual label mapping
        return {"default_label": 0}
    
    def run_complete_pipeline(self, pipeline_id: str) -> str:
        """Run the complete data processing pipeline"""
        try:
            logger.info(f"Starting data processing pipeline: {pipeline_id}")
            
            # Download raw data
            audio_files = self.download_raw_data(pipeline_id)
            
            # Process audio files
            processed_data = self.process_audio_files(audio_files, pipeline_id)
            
            # Apply data augmentation
            augmented_data = self.augment_data(processed_data, pipeline_id)
            
            # Prepare dataset
            dataset = self.prepare_dataset(augmented_data, pipeline_id)
            
            # Save processed data
            gcs_path = self.save_processed_data(dataset, pipeline_id)
            
            # Update final status
            self.pipeline_status.update_status(
                pipeline_id, "completed", 1.0, 
                f"Data processing complete. Dataset saved to: {gcs_path}",
                metadata={
                    'dataset_path': gcs_path,
                    'dataset_stats': dataset['dataset_stats']
                }
            )
            
            logger.info(f"Data processing pipeline completed: {pipeline_id}")
            return gcs_path
            
        except Exception as e:
            logger.error(f"Data processing pipeline failed: {e}")
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.0, f"Pipeline failed: {e}"
            )
            raise

def main():
    """Main entry point for data processing pipeline"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python data_processor.py <pipeline_id>")
        sys.exit(1)
    
    pipeline_id = sys.argv[1]
    
    # Load configuration
    config_path = os.environ.get('PIPELINE_CONFIG_PATH', '/tmp/pipeline_config.yaml')
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Run data processing pipeline
    processor = DataProcessor(config)
    result = processor.run_complete_pipeline(pipeline_id)
    
    print(f"Data processing completed. Result: {result}")

if __name__ == "__main__":
    main()