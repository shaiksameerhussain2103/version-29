import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCozSaBqERevZMcKufx0VAF4Ti_DtevacQ",
  authDomain: "cmr-gpt.firebaseapp.com",
  projectId: "cmr-gpt",
  storageBucket: "cmr-gpt.firebasestorage.app",
  messagingSenderId: "123005728705",
  appId: "1:123005728705:web:a83a78d6f35bd02adce140",
  measurementId: "G-ZXDR7JFKWH",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
