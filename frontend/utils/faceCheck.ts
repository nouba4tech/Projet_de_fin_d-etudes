// Face check of the booking wizard: face detection on the ID document and on the live selfie, distance between
// the two faces, and a simple liveness test (head turned left then right in front of the camera).
// face-api (TensorFlow.js) and its models (~12 MB) are only downloaded at the identity step.

const FACE_API_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js';
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';

/** Same threshold as the server (IdentityVerificationRepository.MATCH_THRESHOLD). */
export const FACE_MATCH_THRESHOLD = 0.55;

type Point = { x: number; y: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApi = any;

let loading: Promise<FaceApi> | null = null;

export const loadFaceApi = (): Promise<FaceApi> => {
  if (!loading) {
    loading = (async () => {
      const faceapi = await import(/* @vite-ignore */ FACE_API_URL);
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
      return faceapi;
    })().catch(error => {
      loading = null;
      throw error;
    });
  }
  return loading;
};

const loadImage = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Image illisible'));
  image.src = dataUrl;
});

/** Face descriptor of the largest face of an image, or null when no face is found. */
export const describeFace = async (dataUrl: string): Promise<Float32Array | null> => {
  const faceapi = await loadFaceApi();
  const image = await loadImage(dataUrl);
  const result = await faceapi
    .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result ? result.descriptor : null;
};

export const faceDistance = async (documentImage: string, selfieImage: string) => {
  const [documentFace, selfieFace] = await Promise.all([describeFace(documentImage), describeFace(selfieImage)]);
  if (!documentFace || !selfieFace) {
    return { distance: null, documentFace: !!documentFace, selfieFace: !!selfieFace };
  }
  const faceapi = await loadFaceApi();
  return { distance: faceapi.euclideanDistance(documentFace, selfieFace) as number, documentFace: true, selfieFace: true };
};

/**
 * Head orientation on a video frame: 0 = facing the camera, negative/positive = turned to one side or the other.
 * null when no single face is visible.
 */
export const headYaw = async (video: HTMLVideoElement): Promise<number | null> => {
  const faceapi = await loadFaceApi();
  const result = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
    .withFaceLandmarks();
  if (!result) return null;
  const points: Point[] = result.landmarks.positions;
  const leftCheek = points[0];
  const rightCheek = points[16];
  const nose = points[30];
  const width = rightCheek.x - leftCheek.x;
  if (width <= 0) return null;
  // nose position between the two sides of the face: 0.5 when facing the camera
  return (nose.x - leftCheek.x) / width - 0.5;
};

/** Similarity shown to the receptionist: 100 % for identical faces, 0 % from a distance of 1. */
export const similarityPercent = (distance: number) => Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));

/** Reduces a photo to at most maxSide pixels, as JPEG, so that each document stays well under the 2 MB limit. */
export const compressImage = async (source: Blob | string, maxSide = 1280, quality = 0.85): Promise<string> => {
  const dataUrl = typeof source === 'string' ? source : await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Fichier illisible'));
    reader.readAsDataURL(source);
  });
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
};

export const captureFrame = (video: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
};
