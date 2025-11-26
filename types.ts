export interface LandmarkInfo {
  name: string;
  shortDescription: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface TourData {
  landmark: LandmarkInfo;
  historyText: string;
  groundingSources: GroundingChunk[];
  audioBuffer?: AudioBuffer;
}

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  FETCHING_HISTORY = 'FETCHING_HISTORY',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  SHOWING_RESULT = 'SHOWING_RESULT',
  ERROR = 'ERROR'
}
