export const getAuth = jest.fn(() => ({}));
export const signInWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const onAuthStateChanged = jest.fn((_auth: unknown, cb: (u: null) => void) => {
  cb(null);
  return jest.fn();
});
