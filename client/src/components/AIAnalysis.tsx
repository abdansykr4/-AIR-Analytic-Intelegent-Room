import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb, Fan, Plus, Leaf, ThermometerSun, Volume, SlidersVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiAnalysis } from '@shared/schema';

interface AIAnalysisProps {
  analysis?: AiAnalysis | null;
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'heating':
    case 'cooling':
      return ThermometerSun;
    case 'humidification':
    case 'dehumidification':
      return Fan;
    case 'lighting':
      return Plus;
    case 'lighting_reduction':
      return SlidersVertical;
    case 'air_purification':
      return Leaf;
    case 'noise_reduction':
      return Volume;
    default:
      return Lightbulb;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 border-red-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'low':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getAnalysisPoints = (analysisText?: string) => {
  if (!analysisText) return [];
  
  // Split the analysis text into meaningful points
  const sentences = analysisText.split('.').filter(s => s.trim());
  return sentences.map((sentence, index) => ({
    text: sentence.trim() + '.',
    type: sentence.toLowerCase().includes('concern') || sentence.toLowerCase().includes('issue') 
      ? 'warning' 
      : sentence.toLowerCase().includes('optimal') || sentence.toLowerCase().includes('comfortable')
      ? 'success'
      : 'info'
  }));
};

export function AIAnalysis({ analysis }: AIAnalysisProps) {
  const analysisPoints = getAnalysisPoints(analysis?.analysisText);
  const recommendations = analysis?.recommendations as Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    icon?: string;
  }> || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="text-primary h-5 w-5 mr-3" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisPoints.length > 0 ? (
            <div className="space-y-3">
              {analysisPoints.map((point, index) => (
                <div key={index} className="flex items-start">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0",
                    point.type === 'warning' ? 'bg-yellow-500' :
                    point.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  )} />
                  <p className="text-gray-700 text-sm">{point.text}</p>
                </div>
              ))}
              {analysis?.confidence && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Analysis Confidence</span>
                    <span className="font-medium text-gray-800">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(analysis.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No analysis data available</p>
              <p className="text-sm text-gray-400">Waiting for sensor data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="text-primary h-5 w-5 mr-3" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => {
                const IconComponent = getRecommendationIcon(recommendation.type);
                const priorityColor = getPriorityColor(recommendation.priority);

                return (
                  <div key={index} className={cn(
                    "flex items-center p-3 rounded-lg border",
                    priorityColor
                  )}>
                    <IconComponent className={cn(
                      "mr-3 h-4 w-4",
                      recommendation.priority === 'high' ? 'text-red-600' :
                      recommendation.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    )} />
                    <span className="text-gray-800 text-sm flex-1">{recommendation.message}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    )}>
                      {recommendation.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recommendations available</p>
              <p className="text-sm text-gray-400">Environment appears optimal</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
