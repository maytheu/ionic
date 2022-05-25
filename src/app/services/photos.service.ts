import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';

export interface UserPhoto {
  filePath: string;
  webViewPath: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotosService {
  photos: UserPhoto[] = [];
  private photoStorage = 'photos';

  constructor(private platform: Platform) {}

  async addToGallery() {
    // take photo
    const newPhoto = await Camera.getPhoto({
      quality: 100,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    // add photos to collection
    const savedImageFile = await this.savePicture(newPhoto);

    this.photos.unshift(savedImageFile);
  }

  async loadImages() {
    const photoList = await Storage.get({ key: this.photoStorage });

    this.photos = JSON.parse(photoList.value) || [];

    // web platform
    if (!this.platform.is('hybrid')) {
      for (const photo of this.photos) {
        const rdFile = await Filesystem.readFile({
          path: photo.filePath,
          directory: Directory.Data,
        });

        // for web
        photo.webViewPath = `data:image/jpeg;base64,${rdFile.data}`;
      }
    }
  }

  private async savePicture(photo: Photo) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(photo);

    //  write the file
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      directory: Directory.Data,
      data: base64Data,
      path: fileName,
    });

    Storage.set({
      key: this.photoStorage,
      value: JSON.stringify(this.photos),
    });
    if (this.platform.is('hybrid')) {
      return {
        filePath: savedFile.uri,
        webViewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return { filePath: fileName, webViewPath: photo.webPath };
    }
  }

  private async readAsBase64(photo: Photo) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({ path: photo.path });
      return file.data;
    }
    // Fetch the photo, read as a blob, then convert to base64 format
    const resp = await fetch(photo.webPath);
    const blob = await resp.blob();

    return (await this.convertBlobToBase64(blob)) as string;
  }

  private convertBlobToBase64 = (blob: Blob) =>
    new Promise((res, rej) => {
      const reader = new FileReader();

      reader.onerror = rej;
      reader.onload = () => {
        res(reader.result);
      };

      reader.readAsDataURL(blob);
    });
}
