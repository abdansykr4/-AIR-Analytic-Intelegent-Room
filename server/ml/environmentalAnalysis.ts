import * as tf from '@tensorflow/tfjs';
import type { SensorReading } from '@shared/schema';

interface EnvironmentalAnalysis {
  overallStatus: 'comfortable' | 'warning' | 'critical';
  temperatureStatus: 'comfortable' | 'warning' | 'critical';
  humidityStatus: 'comfortable' | 'warning' | 'critical';
  noiseStatus: 'comfortable' | 'warning' | 'critical';
  lightStatus: 'comfortable' | 'warning' | 'critical';
  airQualityStatus: 'comfortable' | 'warning' | 'critical';
  analysisText: string;
  recommendations: Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    icon: string;
  }>;
  confidence: number;
}

// Optimal ranges for environmental parameters
const OPTIMAL_RANGES = {
  temperature: { min: 20, max: 25, unit: '°C' },
  humidity: { min: 40, max: 60, unit: '%' },
  noiseLevel: { min: 0, max: 50, unit: 'dB' },
  lightIntensity: { min: 300, max: 500, unit: 'lux' },
  airQuality: { min: 0, max: 15, unit: 'μg/m³' }
};

// Custom ML model for environmental analysis
class EnvironmentalMLModel {
  private model: tf.LayersModel | null = null;
  private scaler: { mean: number[], std: number[] } | null = null;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // Create a simple neural network for environmental analysis
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [5], // 5 sensor inputs
            units: 16,
            activation: 'relu',
            kernelInitializer: 'randomNormal'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 8,
            activation: 'relu',
            kernelInitializer: 'randomNormal'
          }),
          tf.layers.dense({
            units: 3, // 3 status classes: comfortable, warning, critical
            activation: 'softmax'
          })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Initialize with synthetic training data for demonstration
      await this.trainModel();

      console.log('Environmental ML model initialized successfully');
    } catch (error) {
      console.error('Error initializing ML model:', error);
    }
  }

  private async trainModel() {
    // Generate synthetic training data based on optimal ranges
    const trainingData = this.generateTrainingData(1000);
    
    const xs = tf.tensor2d(trainingData.inputs);
    const ys = tf.tensor2d(trainingData.outputs);

    // Calculate normalization parameters
    const mean = xs.mean(0);
    const std = xs.sub(mean).square().mean(0).sqrt();
    
    this.scaler = {
      mean: await mean.data() as number[],
      std: await std.data() as number[]
    };

    // Normalize input data
    const normalizedXs = xs.sub(mean).div(std);

    if (this.model) {
      await this.model.fit(normalizedXs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });
    }

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    normalizedXs.dispose();
    mean.dispose();
    std.dispose();
  }

  private generateTrainingData(samples: number) {
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    for (let i = 0; i < samples; i++) {
      // Generate random sensor values
      const temperature = 15 + Math.random() * 20; // 15-35°C
      const humidity = 20 + Math.random() * 70; // 20-90%
      const noiseLevel = 20 + Math.random() * 80; // 20-100 dB
      const lightIntensity = 50 + Math.random() * 1000; // 50-1050 lux
      const airQuality = Math.random() * 100; // 0-100 μg/m³

      inputs.push([temperature, humidity, noiseLevel, lightIntensity, airQuality]);

      // Determine status based on how many parameters are out of range
      const outOfRange = [
        temperature < OPTIMAL_RANGES.temperature.min || temperature > OPTIMAL_RANGES.temperature.max,
        humidity < OPTIMAL_RANGES.humidity.min || humidity > OPTIMAL_RANGES.humidity.max,
        noiseLevel > OPTIMAL_RANGES.noiseLevel.max,
        lightIntensity < OPTIMAL_RANGES.lightIntensity.min || lightIntensity > OPTIMAL_RANGES.lightIntensity.max,
        airQuality > OPTIMAL_RANGES.airQuality.max
      ].filter(Boolean).length;

      // Create one-hot encoded output
      let status: number[] = [0, 0, 0]; // [comfortable, warning, critical]
      
      if (outOfRange === 0) {
        status = [1, 0, 0]; // comfortable
      } else if (outOfRange <= 2) {
        status = [0, 1, 0]; // warning
      } else {
        status = [0, 0, 1]; // critical
      }

      outputs.push(status);
    }

    return { inputs, outputs };
  }

  public async predict(sensorData: SensorReading): Promise<{ status: string; confidence: number }> {
    if (!this.model || !this.scaler) {
      return { status: 'warning', confidence: 0.5 };
    }

    try {
      const input = [
        sensorData.temperature || 22,
        sensorData.humidity || 50,
        sensorData.noiseLevel || 40,
        sensorData.lightIntensity || 300,
        sensorData.airQuality || 15
      ];

      // Normalize input
      const normalizedInput = input.map((value, i) => 
        (value - this.scaler!.mean[i]) / this.scaler!.std[i]
      );

      const inputTensor = tf.tensor2d([normalizedInput]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      const statuses = ['comfortable', 'warning', 'critical'];
      
      return {
        status: statuses[maxIndex],
        confidence: probabilities[maxIndex]
      };
    } catch (error) {
      console.error('Error in ML prediction:', error);
      return { status: 'warning', confidence: 0.5 };
    }
  }
}

// Initialize the ML model
const environmentalModel = new EnvironmentalMLModel();

// Helper functions for status determination
function getParameterStatus(value: number, min: number, max: number): 'comfortable' | 'warning' | 'critical' {
  if (value >= min && value <= max) return 'comfortable';
  
  const deviation = Math.max(
    Math.abs(value - min) / min,
    Math.abs(value - max) / max
  );
  
  return deviation > 0.5 ? 'critical' : 'warning';
}

function generateAnalysisText(
  sensorData: SensorReading,
  statuses: Record<string, string>
): string {
  const issues: string[] = [];
  const positives: string[] = [];

  // Check each parameter
  if (statuses.temperature !== 'comfortable') {
    const temp = sensorData.temperature || 0;
    if (temp < OPTIMAL_RANGES.temperature.min) {
      issues.push('temperature is too low');
    } else {
      issues.push('temperature is too high');
    }
  } else {
    positives.push('temperature is comfortable');
  }

  if (statuses.humidity !== 'comfortable') {
    const humidity = sensorData.humidity || 0;
    if (humidity < OPTIMAL_RANGES.humidity.min) {
      issues.push('air is too dry');
    } else {
      issues.push('humidity levels are too high');
    }
  } else {
    positives.push('humidity levels are optimal');
  }

  if (statuses.noise !== 'comfortable') {
    issues.push('noise levels exceed comfortable ranges');
  } else {
    positives.push('noise levels are acceptable');
  }

  if (statuses.light !== 'comfortable') {
    const light = sensorData.lightIntensity || 0;
    if (light < OPTIMAL_RANGES.lightIntensity.min) {
      issues.push('lighting is insufficient');
    } else {
      issues.push('lighting is too bright');
    }
  } else {
    positives.push('lighting conditions are optimal');
  }

  if (statuses.airQuality !== 'comfortable') {
    issues.push('air quality needs improvement');
  } else {
    positives.push('air quality is good');
  }

  let text = '';
  if (issues.length > 0) {
    text += `Current concerns: ${issues.join(', ')}.`;
  }
  if (positives.length > 0) {
    text += ` ${positives.join(' and ')}.`;
  }

  return text || 'Environmental conditions are being monitored.';
}

function generateRecommendations(
  sensorData: SensorReading,
  statuses: Record<string, string>
): Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high'; icon: string }> {
  const recommendations: Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high'; icon: string }> = [];

  if (statuses.temperature !== 'comfortable') {
    const temp = sensorData.temperature || 0;
    if (temp < OPTIMAL_RANGES.temperature.min) {
      recommendations.push({
        type: 'heating',
        message: 'Increase heating to raise temperature to comfortable levels',
        priority: 'medium',
        icon: 'fas fa-thermometer-full'
      });
    } else {
      recommendations.push({
        type: 'cooling',
        message: 'Turn on air conditioning to reduce temperature',
        priority: 'medium',
        icon: 'fas fa-snowflake'
      });
    }
  }

  if (statuses.humidity !== 'comfortable') {
    const humidity = sensorData.humidity || 0;
    if (humidity < OPTIMAL_RANGES.humidity.min) {
      recommendations.push({
        type: 'humidification',
        message: 'Use a humidifier to increase moisture levels',
        priority: 'low',
        icon: 'fas fa-tint'
      });
    } else {
      recommendations.push({
        type: 'dehumidification',
        message: 'Turn on dehumidifier or improve ventilation',
        priority: 'medium',
        icon: 'fas fa-fan'
      });
    }
  }

  if (statuses.noise !== 'comfortable') {
    recommendations.push({
      type: 'noise_reduction',
      message: 'Implement noise reduction measures or relocate noise sources',
      priority: 'medium',
      icon: 'fas fa-volume-mute'
    });
  }

  if (statuses.light !== 'comfortable') {
    const light = sensorData.lightIntensity || 0;
    if (light < OPTIMAL_RANGES.lightIntensity.min) {
      recommendations.push({
        type: 'lighting',
        message: 'Increase lighting by 200-300 lux for optimal comfort',
        priority: 'high',
        icon: 'fas fa-lightbulb'
      });
    } else {
      recommendations.push({
        type: 'lighting_reduction',
        message: 'Reduce lighting intensity or use blinds to control brightness',
        priority: 'low',
        icon: 'fas fa-adjust'
      });
    }
  }

  if (statuses.airQuality !== 'comfortable') {
    recommendations.push({
      type: 'air_purification',
      message: 'Activate air purifier and check filter replacement',
      priority: 'high',
      icon: 'fas fa-leaf'
    });
  }

  return recommendations;
}

export async function analyzeEnvironmentalData(sensorData: SensorReading): Promise<EnvironmentalAnalysis> {
  try {
    // Get individual parameter statuses
    const temperatureStatus = getParameterStatus(
      sensorData.temperature || 22,
      OPTIMAL_RANGES.temperature.min,
      OPTIMAL_RANGES.temperature.max
    );

    const humidityStatus = getParameterStatus(
      sensorData.humidity || 50,
      OPTIMAL_RANGES.humidity.min,
      OPTIMAL_RANGES.humidity.max
    );

    const noiseStatus = getParameterStatus(
      sensorData.noiseLevel || 40,
      OPTIMAL_RANGES.noiseLevel.min,
      OPTIMAL_RANGES.noiseLevel.max
    );

    const lightStatus = getParameterStatus(
      sensorData.lightIntensity || 300,
      OPTIMAL_RANGES.lightIntensity.min,
      OPTIMAL_RANGES.lightIntensity.max
    );

    const airQualityStatus = getParameterStatus(
      sensorData.airQuality || 15,
      0,
      OPTIMAL_RANGES.airQuality.max
    );

    const statuses = {
      temperature: temperatureStatus,
      humidity: humidityStatus,
      noise: noiseStatus,
      light: lightStatus,
      airQuality: airQualityStatus
    };

    // Use ML model to determine overall status
    const mlPrediction = await environmentalModel.predict(sensorData);
    
    // Combine rule-based and ML-based analysis
    const criticalCount = Object.values(statuses).filter(s => s === 'critical').length;
    const warningCount = Object.values(statuses).filter(s => s === 'warning').length;
    
    let overallStatus: 'comfortable' | 'warning' | 'critical';
    if (criticalCount > 0 || mlPrediction.status === 'critical') {
      overallStatus = 'critical';
    } else if (warningCount > 1 || mlPrediction.status === 'warning') {
      overallStatus = 'warning';
    } else {
      overallStatus = 'comfortable';
    }

    const analysisText = generateAnalysisText(sensorData, statuses);
    const recommendations = generateRecommendations(sensorData, statuses);

    return {
      overallStatus,
      temperatureStatus,
      humidityStatus,
      noiseStatus,
      lightStatus,
      airQualityStatus,
      analysisText,
      recommendations,
      confidence: Math.max(0.6, mlPrediction.confidence) // Ensure minimum confidence
    };
  } catch (error) {
    console.error('Error in environmental analysis:', error);
    
    // Fallback analysis
    return {
      overallStatus: 'warning',
      temperatureStatus: 'comfortable',
      humidityStatus: 'comfortable',
      noiseStatus: 'comfortable',
      lightStatus: 'comfortable',
      airQualityStatus: 'comfortable',
      analysisText: 'Environmental analysis temporarily unavailable',
      recommendations: [],
      confidence: 0.5
    };
  }
}
