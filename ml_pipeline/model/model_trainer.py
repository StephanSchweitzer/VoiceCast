"""
Model Training and Inference for Audio ML Pipeline
This module handles:
- Model architecture definition
- Training pipeline execution
- Model evaluation and validation
- Model saving to Vertex AI
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import pickle
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import yaml
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import joblib

from ..pipeline_utils import GCPConfig, StorageManager, PipelineStatus, VertexAIManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioDataset(Dataset):
    """PyTorch Dataset for audio features"""
    
    def __init__(self, features: np.ndarray, labels: np.ndarray, metadata: List[Dict]):
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)
        self.metadata = metadata
        
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx], self.metadata[idx]

class AudioClassifier(nn.Module):
    """Neural network model for audio classification"""
    
    def __init__(self, 
                 input_dim: int,
                 hidden_dims: List[int] = [512, 256, 128],
                 num_classes: int = 2,
                 dropout_rate: float = 0.3):
        super(AudioClassifier, self).__init__()
        
        self.input_dim = input_dim
        self.num_classes = num_classes
        
        # Build network layers
        layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_dim),
                nn.Dropout(dropout_rate)
            ])
            prev_dim = hidden_dim
        
        # Output layer
        layers.append(nn.Linear(prev_dim, num_classes))
        
        self.network = nn.Sequential(*layers)
        
        # Initialize weights
        self.apply(self._init_weights)
        
    def _init_weights(self, module):
        """Initialize network weights"""
        if isinstance(module, nn.Linear):
            nn.init.xavier_uniform_(module.weight)
            nn.init.constant_(module.bias, 0)
    
    def forward(self, x):
        return self.network(x)

class TransformerAudioModel(nn.Module):
    """Transformer-based model for audio sequence processing"""
    
    def __init__(self,
                 input_dim: int,
                 d_model: int = 512,
                 nhead: int = 8,
                 num_encoder_layers: int = 6,
                 num_classes: int = 2,
                 dropout_rate: float = 0.1,
                 max_seq_length: int = 1000):
        super(TransformerAudioModel, self).__init__()
        
        self.input_dim = input_dim
        self.d_model = d_model
        self.max_seq_length = max_seq_length
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, d_model)
        
        # Positional encoding
        self.positional_encoding = self._create_positional_encoding(max_seq_length, d_model)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dropout=dropout_rate,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=num_encoder_layers
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(d_model // 2, num_classes)
        )
        
        self.apply(self._init_weights)
    
    def _create_positional_encoding(self, max_len: int, d_model: int):
        """Create positional encoding for transformer"""
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * 
                           (-np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        return pe.unsqueeze(0)
    
    def _init_weights(self, module):
        """Initialize network weights"""
        if isinstance(module, nn.Linear):
            nn.init.xavier_uniform_(module.weight)
            nn.init.constant_(module.bias, 0)
    
    def forward(self, x):
        # Reshape input for sequence processing
        batch_size = x.size(0)
        seq_len = min(x.size(1), self.max_seq_length)
        
        # Project input to d_model
        x = self.input_projection(x[:, :seq_len])
        
        # Add positional encoding
        x = x + self.positional_encoding[:, :seq_len].to(x.device)
        
        # Apply transformer encoder
        x = self.transformer_encoder(x)
        
        # Global average pooling
        x = x.mean(dim=1)
        
        # Classification
        return self.classifier(x)

class ModelTrainer:
    """Handles model training, validation, and evaluation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.gcp_config = GCPConfig()
        self.storage_manager = StorageManager(self.gcp_config)
        self.pipeline_status = PipelineStatus(self.gcp_config)
        self.vertex_ai_manager = VertexAIManager(self.gcp_config)
        
        # Training configuration
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.optimizer = None
        self.criterion = None
        self.train_loader = None
        self.val_loader = None
        
        logger.info(f"ModelTrainer initialized on device: {self.device}")
    
    def load_dataset(self, dataset_path: str) -> Dict[str, Any]:
        """Load processed dataset from GCS"""
        try:
            # Download dataset from GCS
            local_path = "/tmp/dataset.pkl"
            bucket_name = self.gcp_config.buckets['processed_data']
            blob_name = dataset_path.replace(f"gs://{bucket_name}/", "")
            
            self.storage_manager.download_file(bucket_name, blob_name, local_path)
            
            # Load dataset
            with open(local_path, 'rb') as f:
                dataset = pickle.load(f)
            
            # Clean up
            os.remove(local_path)
            
            logger.info(f"Dataset loaded: {dataset['dataset_stats']}")
            return dataset
            
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise
    
    def create_data_loaders(self, dataset: Dict[str, Any]) -> Tuple[DataLoader, DataLoader]:
        """Create PyTorch data loaders"""
        try:
            # Create training dataset
            train_dataset = AudioDataset(
                dataset['X_train'],
                dataset['y_train'],
                dataset['metadata_train']
            )
            
            # Create validation dataset
            val_dataset = AudioDataset(
                dataset['X_val'],
                dataset['y_val'],
                dataset['metadata_val']
            )
            
            # Create data loaders
            train_loader = DataLoader(
                train_dataset,
                batch_size=self.config['training']['batch_size'],
                shuffle=True,
                num_workers=2,
                pin_memory=True if self.device.type == 'cuda' else False
            )
            
            val_loader = DataLoader(
                val_dataset,
                batch_size=self.config['training']['batch_size'],
                shuffle=False,
                num_workers=2,
                pin_memory=True if self.device.type == 'cuda' else False
            )
            
            logger.info(f"Data loaders created: train={len(train_loader)}, val={len(val_loader)}")
            return train_loader, val_loader
            
        except Exception as e:
            logger.error(f"Failed to create data loaders: {e}")
            raise
    
    def create_model(self, input_dim: int, num_classes: int) -> nn.Module:
        """Create model based on configuration"""
        try:
            model_type = self.config['training']['model_type']
            
            if model_type == 'mlp':
                model = AudioClassifier(
                    input_dim=input_dim,
                    hidden_dims=self.config['training'].get('hidden_dims', [512, 256, 128]),
                    num_classes=num_classes,
                    dropout_rate=self.config['training'].get('dropout_rate', 0.3)
                )
            elif model_type == 'transformer':
                model = TransformerAudioModel(
                    input_dim=input_dim,
                    d_model=self.config['training'].get('d_model', 512),
                    nhead=self.config['training'].get('nhead', 8),
                    num_encoder_layers=self.config['training'].get('num_encoder_layers', 6),
                    num_classes=num_classes,
                    dropout_rate=self.config['training'].get('dropout_rate', 0.1)
                )
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            model = model.to(self.device)
            
            # Print model summary
            total_params = sum(p.numel() for p in model.parameters())
            trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
            
            logger.info(f"Model created: {model_type}")
            logger.info(f"Total parameters: {total_params:,}")
            logger.info(f"Trainable parameters: {trainable_params:,}")
            
            return model
            
        except Exception as e:
            logger.error(f"Failed to create model: {e}")
            raise
    
    def train_epoch(self, epoch: int, pipeline_id: str) -> Dict[str, float]:
        """Train model for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch}")
        
        for batch_idx, (data, target, metadata) in enumerate(progress_bar):
            data, target = data.to(self.device), target.to(self.device)
            
            # Zero gradients
            self.optimizer.zero_grad()
            
            # Forward pass
            output = self.model(data)
            loss = self.criterion(output, target)
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            # Statistics
            total_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()
            
            # Update progress bar
            progress_bar.set_postfix({
                'Loss': f'{loss.item():.4f}',
                'Acc': f'{100.*correct/total:.2f}%'
            })
        
        # Calculate epoch metrics
        epoch_loss = total_loss / len(self.train_loader)
        epoch_acc = 100. * correct / total
        
        # Update pipeline status
        progress = (epoch + 1) / self.config['training']['epochs']
        self.pipeline_status.update_status(
            pipeline_id, "running", progress,
            f"Training epoch {epoch+1}/{self.config['training']['epochs']} - "
            f"Loss: {epoch_loss:.4f}, Acc: {epoch_acc:.2f}%"
        )
        
        return {
            'loss': epoch_loss,
            'accuracy': epoch_acc
        }
    
    def validate_epoch(self, epoch: int) -> Dict[str, float]:
        """Validate model for one epoch"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        all_predictions = []
        all_targets = []
        
        with torch.no_grad():
            for data, target, metadata in self.val_loader:
                data, target = data.to(self.device), target.to(self.device)
                
                # Forward pass
                output = self.model(data)
                loss = self.criterion(output, target)
                
                # Statistics
                total_loss += loss.item()
                _, predicted = output.max(1)
                total += target.size(0)
                correct += predicted.eq(target).sum().item()
                
                # Store predictions for detailed metrics
                all_predictions.extend(predicted.cpu().numpy())
                all_targets.extend(target.cpu().numpy())
        
        # Calculate metrics
        val_loss = total_loss / len(self.val_loader)
        val_acc = 100. * correct / total
        
        # Calculate detailed metrics
        precision = precision_score(all_targets, all_predictions, average='weighted')
        recall = recall_score(all_targets, all_predictions, average='weighted')
        f1 = f1_score(all_targets, all_predictions, average='weighted')
        
        return {
            'loss': val_loss,
            'accuracy': val_acc,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    
    def train_model(self, dataset: Dict[str, Any], pipeline_id: str) -> Dict[str, Any]:
        """Train the complete model"""
        try:
            logger.info(f"Starting model training: {pipeline_id}")
            
            # Create data loaders
            self.train_loader, self.val_loader = self.create_data_loaders(dataset)
            
            # Create model
            input_dim = dataset['X_train'].shape[1]
            num_classes = dataset['dataset_stats']['num_classes']
            self.model = self.create_model(input_dim, num_classes)
            
            # Create optimizer and criterion
            self.optimizer = optim.Adam(
                self.model.parameters(),
                lr=self.config['training']['learning_rate'],
                weight_decay=self.config['training'].get('weight_decay', 1e-4)
            )
            
            self.criterion = nn.CrossEntropyLoss()
            
            # Training loop
            train_history = []
            val_history = []
            best_val_loss = float('inf')
            patience_counter = 0
            
            for epoch in range(self.config['training']['epochs']):
                # Train epoch
                train_metrics = self.train_epoch(epoch, pipeline_id)
                train_history.append(train_metrics)
                
                # Validate epoch
                val_metrics = self.validate_epoch(epoch)
                val_history.append(val_metrics)
                
                logger.info(f"Epoch {epoch+1}: Train Loss={train_metrics['loss']:.4f}, "
                           f"Val Loss={val_metrics['loss']:.4f}, "
                           f"Val Acc={val_metrics['accuracy']:.2f}%")
                
                # Early stopping
                if val_metrics['loss'] < best_val_loss:
                    best_val_loss = val_metrics['loss']
                    patience_counter = 0
                    
                    # Save best model
                    torch.save({
                        'epoch': epoch,
                        'model_state_dict': self.model.state_dict(),
                        'optimizer_state_dict': self.optimizer.state_dict(),
                        'best_val_loss': best_val_loss,
                        'config': self.config
                    }, f"/tmp/best_model_{pipeline_id}.pt")
                    
                else:
                    patience_counter += 1
                    
                if patience_counter >= self.config['training']['early_stopping']['patience']:
                    logger.info(f"Early stopping triggered at epoch {epoch+1}")
                    break
            
            # Load best model
            checkpoint = torch.load(f"/tmp/best_model_{pipeline_id}.pt")
            self.model.load_state_dict(checkpoint['model_state_dict'])
            
            # Final evaluation
            final_metrics = self.validate_epoch(epoch)
            
            training_results = {
                'model': self.model,
                'final_metrics': final_metrics,
                'train_history': train_history,
                'val_history': val_history,
                'best_epoch': checkpoint['epoch'],
                'model_config': {
                    'input_dim': input_dim,
                    'num_classes': num_classes,
                    'model_type': self.config['training']['model_type']
                }
            }
            
            logger.info(f"Training completed: {final_metrics}")
            return training_results
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.0, f"Training failed: {e}"
            )
            raise
    
    def save_model(self, training_results: Dict[str, Any], pipeline_id: str) -> str:
        """Save trained model and artifacts"""
        try:
            logger.info("Saving model artifacts")
            
            # Save model state
            model_path = f"/tmp/trained_model_{pipeline_id}.pt"
            torch.save({
                'model_state_dict': training_results['model'].state_dict(),
                'model_config': training_results['model_config'],
                'final_metrics': training_results['final_metrics'],
                'training_config': self.config
            }, model_path)
            
            # Save training history
            history_path = f"/tmp/training_history_{pipeline_id}.json"
            with open(history_path, 'w') as f:
                json.dump({
                    'train_history': training_results['train_history'],
                    'val_history': training_results['val_history'],
                    'best_epoch': training_results['best_epoch']
                }, f, indent=2)
            
            # Create model info
            model_info = {
                'pipeline_id': pipeline_id,
                'model_type': self.config['training']['model_type'],
                'final_metrics': training_results['final_metrics'],
                'model_config': training_results['model_config'],
                'training_config': self.config['training']
            }
            
            info_path = f"/tmp/model_info_{pipeline_id}.json"
            with open(info_path, 'w') as f:
                json.dump(model_info, f, indent=2)
            
            # Upload to GCS
            models_bucket = self.gcp_config.buckets['models']
            
            model_gcs_path = self.storage_manager.upload_file(
                models_bucket, model_path, f"models/model_{pipeline_id}.pt"
            )
            
            self.storage_manager.upload_file(
                models_bucket, history_path, f"models/history_{pipeline_id}.json"
            )
            
            self.storage_manager.upload_file(
                models_bucket, info_path, f"models/info_{pipeline_id}.json"
            )
            
            # Clean up local files
            os.remove(model_path)
            os.remove(history_path)
            os.remove(info_path)
            
            logger.info(f"Model saved to: {model_gcs_path}")
            return model_gcs_path
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise
    
    def upload_to_vertex_ai(self, model_gcs_path: str, pipeline_id: str) -> str:
        """Upload model to Vertex AI Model Registry"""
        try:
            logger.info("Uploading model to Vertex AI")
            
            # Create model display name
            display_name = f"voicecast-ml-model-{pipeline_id}"
            
            # Model artifact URI (directory containing the model)
            artifact_uri = model_gcs_path.rsplit('/', 1)[0] + '/'
            
            # Use a placeholder serving container (would be customized for your model)
            serving_container_uri = "gcr.io/cloud-aiplatform/prediction/pytorch-gpu.1-7:latest"
            
            # Upload to Vertex AI
            vertex_model_name = self.vertex_ai_manager.upload_model(
                display_name=display_name,
                artifact_uri=artifact_uri,
                serving_container_image_uri=serving_container_uri,
                description=f"Audio ML model trained via pipeline {pipeline_id}"
            )
            
            logger.info(f"Model uploaded to Vertex AI: {vertex_model_name}")
            return vertex_model_name
            
        except Exception as e:
            logger.error(f"Failed to upload to Vertex AI: {e}")
            raise
    
    def run_training_pipeline(self, dataset_path: str, pipeline_id: str) -> Dict[str, Any]:
        """Run complete training pipeline"""
        try:
            logger.info(f"Starting training pipeline: {pipeline_id}")
            
            # Load dataset
            dataset = self.load_dataset(dataset_path)
            
            # Train model
            training_results = self.train_model(dataset, pipeline_id)
            
            # Save model
            model_gcs_path = self.save_model(training_results, pipeline_id)
            
            # Upload to Vertex AI
            vertex_model_name = self.upload_to_vertex_ai(model_gcs_path, pipeline_id)
            
            # Final results
            results = {
                'pipeline_id': pipeline_id,
                'model_gcs_path': model_gcs_path,
                'vertex_model_name': vertex_model_name,
                'final_metrics': training_results['final_metrics'],
                'model_config': training_results['model_config']
            }
            
            # Update pipeline status
            self.pipeline_status.update_status(
                pipeline_id, "completed", 1.0,
                f"Training completed successfully",
                metadata=results
            )
            
            logger.info(f"Training pipeline completed: {pipeline_id}")
            return results
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            self.pipeline_status.update_status(
                pipeline_id, "failed", 0.0, f"Training failed: {e}"
            )
            raise

def main():
    """Main entry point for training pipeline"""
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python model_trainer.py <dataset_path> <pipeline_id>")
        sys.exit(1)
    
    dataset_path = sys.argv[1]
    pipeline_id = sys.argv[2]
    
    # Load configuration
    config_path = os.environ.get('PIPELINE_CONFIG_PATH', '/tmp/pipeline_config.yaml')
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Run training pipeline
    trainer = ModelTrainer(config)
    result = trainer.run_training_pipeline(dataset_path, pipeline_id)
    
    print(f"Training completed. Result: {result}")

if __name__ == "__main__":
    main()