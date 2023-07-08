export interface LocalStorageDataSavedPayload {
  x: number;
  y: number;
}

export interface LocalStorageDataSaved {
  [key: string]: LocalStorageDataSavedPayload;
}

export interface LocalStorageData extends LocalStorageDataSavedPayload {
  id: string;
}

export interface LocalStorageDataWithNullXY extends Omit<LocalStorageData, 'x' | 'y'> {
  x: number | undefined;
  y: number | undefined;
}
