import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  ref as _ref, // 필요 없으면 이 alias도 제거 가능
} from 'firebase/storage';
import { storage } from '../firebase';

// (옵션) dataURL → Blob
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

function buildPath(projectId, ideaId, fileName) {
  return `projects/${projectId}/ideas/${ideaId}/${fileName}`;
}

export async function uploadDataUrl(dataURL, path) {
  if (!dataURL?.startsWith('data:')) {
    throw new Error('uploadDataUrl: dataURL 형식이 아닙니다.');
  }
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataURL, 'data_url');
  return await getDownloadURL(storageRef);
}

export async function uploadCanvasImage(dataURL, projectId, ideaId) {
  try {
    const fileName = `canvas_${Date.now()}.png`;
    const path = buildPath(projectId, ideaId, fileName);

    if (typeof dataURL === 'string' && dataURL.startsWith('data:')) {
      return await uploadDataUrl(dataURL, path);
    }

    const blob =
      dataURL instanceof Blob ? dataURL : dataURLtoBlob(String(dataURL));
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

export async function uploadIflImage(imageURL, projectId, ideaId) {
  try {
    const fileName = `ifl_${Date.now()}.png`;
    const path = buildPath(projectId, ideaId, fileName);

    if (typeof imageURL === 'string' && imageURL.startsWith('data:')) {
      return await uploadDataUrl(imageURL, path);
    }

    const response = await fetch(imageURL, { mode: 'cors' });
    if (!response.ok) throw new Error(`이미지 다운로드 실패: ${response.status}`);
    const blob = await response.blob();

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('IFL 이미지 업로드 실패:', error);
    throw error;
  }
}

export async function deleteStorageImage(imageURLorPath) {
  try {
    let fileRef;
    if (typeof imageURLorPath === 'string' && imageURLorPath.startsWith('http')) {
      // ✅ v9에서는 URL도 ref(storage, url)로 바로 전달 가능
      fileRef = ref(storage, imageURLorPath);
    } else {
      fileRef = _ref(storage, imageURLorPath);
    }
    await deleteObject(fileRef);
    console.log('이미지 삭제 완료:', imageURLorPath);
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
  }
}
