import { GENERATED_IMAGES, WILAYA_COORDS } from '../lib/algeria.ts';

export interface UploadedGeoAsset {
  url: string;
  lat: number;
  lng: number;
  capturedAt: string;
  caption: string;
}

export interface UploadService {
  mockUploadGeoPhoto(params: {
    wilaya?: string;
    caption?: string;
    preset?: keyof typeof GENERATED_IMAGES;
  }): Promise<UploadedGeoAsset>;
}

export class MockGeoUploadService implements UploadService {
  async mockUploadGeoPhoto(params: {
    wilaya?: string;
    caption?: string;
    preset?: keyof typeof GENERATED_IMAGES;
  }): Promise<UploadedGeoAsset> {
    const baseCoords = WILAYA_COORDS[params.wilaya || '09 - Blida'] || {
      lat: 36.4722,
      lng: 2.8277,
    };
    const jitterLat = (Math.random() - 0.5) * 0.02;
    const jitterLng = (Math.random() - 0.5) * 0.02;
    const url = GENERATED_IMAGES[params.preset || 'spgVisit'];
    return {
      url,
      lat: Number((baseCoords.lat + jitterLat).toFixed(5)),
      lng: Number((baseCoords.lng + jitterLng).toFixed(5)),
      capturedAt: new Date().toISOString(),
      caption: params.caption || 'Geotagged SPG field inspection photo',
    };
  }
}

export const uploadService: UploadService = new MockGeoUploadService();
