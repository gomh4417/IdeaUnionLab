import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  ref as _ref, // 필요 없으면 이 alias도 제거 가능
} from 'firebase/storage';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { storage, db } from '../firebase';

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

// 특정 아이디어의 실험 데이터를 가져오는 함수
export async function getExperimentData(projectId, ideaId, experimentId) {
  try {
    console.log('🔍 getExperimentData 호출:');
    console.log('- projectId:', projectId);
    console.log('- ideaId:', ideaId);
    console.log('- experimentId:', experimentId);
    
    if (!projectId || !ideaId || !experimentId) {
      throw new Error('필수 파라미터가 누락되었습니다.');
    }

    const path = `projects/${projectId}/ideas/${ideaId}/experiments/${experimentId}`;
    console.log('📍 Firebase 문서 경로:', path);

    const experimentRef = doc(db, 'projects', projectId, 'ideas', ideaId, 'experiments', experimentId);
    const experimentDoc = await getDoc(experimentRef);

    console.log('📄 문서 존재 여부:', experimentDoc.exists());

    if (!experimentDoc.exists()) {
      console.error('❌ 문서를 찾을 수 없음. 경로 확인 필요:', path);
      throw new Error('실험 데이터를 찾을 수 없습니다.');
    }

    const experimentData = experimentDoc.data();
    console.log('📊 조회된 실험 데이터:', experimentData);
    
    // 수정된 데이터 구조로 반환 (일관된 구조)
    const result = {
      id: experimentDoc.id,
      ...experimentData
    };
    
    console.log('✅ 반환할 데이터:', result);
    return result;
  } catch (error) {
    console.error('❌ 실험 데이터 조회 실패:', error);
    throw error;
  }
}

// 특정 아이디어의 모든 실험 목록을 가져오는 함수 (필요시 사용)
export async function getAllExperiments(projectId, ideaId) {
  try {
    console.log('🔍 getAllExperiments 호출:');
    console.log('- projectId:', projectId);
    console.log('- ideaId:', ideaId);
    
    if (!projectId || !ideaId) {
      throw new Error('projectId와 ideaId가 필요합니다.');
    }

    const path = `projects/${projectId}/ideas/${ideaId}/experiments`;
    console.log('📍 Firebase 컬렉션 경로:', path);

    const experimentsRef = collection(db, 'projects', projectId, 'ideas', ideaId, 'experiments');
    const q = query(experimentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    console.log('📊 조회된 실험 수:', querySnapshot.size);

    const experiments = [];
    querySnapshot.forEach((doc) => {
      console.log('📄 실험 문서:', doc.id, doc.data());
      experiments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('✅ 반환할 실험 목록:', experiments);
    return experiments;
  } catch (error) {
    console.error('❌ 실험 목록 조회 실패:', error);
    throw error;
  }
}
