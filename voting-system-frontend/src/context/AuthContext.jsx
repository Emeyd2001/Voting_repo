// import React, { createContext, useContext, useState, useEffect } from "react";
// import { login as apiLogin, getProfile } from "../services/api";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       getProfile()
//         .then((res) => {
//           setUser({ token, ...res.data });
//         })
//         .catch(() => {
//           localStorage.removeItem("token");
//         })
//         .finally(() => setLoading(false));
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const login = async (nni) => {
//     try {
//       const response = await apiLogin(nni);
//       const { token, role, name, hasVoted } = response.data;
//       localStorage.setItem("token", token);
//       const userData = { token, role, name, hasVoted, nni };
//       setUser(userData);
//       return { success: true, role };
//     } catch (err) {
//       const errorMessage = err.response?.data?.detail || "فشل تسجيل الدخول";
//       return { success: false, error: errorMessage };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuthStore = () => useContext(AuthContext);