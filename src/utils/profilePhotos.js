import photo1 from '../assets/profile-photos/1.jpg';
import photo2 from '../assets/profile-photos/2.jpg';
import photo3 from '../assets/profile-photos/3.jpg';
import photo4 from '../assets/profile-photos/4.jpg';
import photo5 from '../assets/profile-photos/5.jpg';

export const PROFILE_PHOTOS = [
  { id: '1', src: photo1 },
  { id: '2', src: photo2 },
  { id: '3', src: photo3 },
  { id: '4', src: photo4 },
  { id: '5', src: photo5 },
];

export function getProfilePhotoById(photoId) {
  if (!photoId) return null;
  return PROFILE_PHOTOS.find((item) => item.id === String(photoId)) || null;
}
