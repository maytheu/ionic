import { Component, OnInit } from '@angular/core';
import { PhotosService, UserPhoto } from '../services/photos.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
})
export class Tab2Page implements OnInit {
  photos: UserPhoto[] = [];

  constructor(public photoService: PhotosService) {
    // this.photos = this.photoService.photos;
  }

  async ngOnInit() {
    this.photos =  this.photoService.photos;
    await this.photoService.loadImages();
  }

  addPhoto() {
    this.photoService.addToGallery();
  }

  showActionSheet(photo: UserPhoto, index: number) {}
}
