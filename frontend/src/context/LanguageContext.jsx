
import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

const languages = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिंदी",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
  },
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("shikshasetu-language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("shikshasetu-language", language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    const selectedLanguage = languages.find(
      (item) => item.code === newLanguage
    );

    if (selectedLanguage) {
      setLanguage(selectedLanguage.code);
    }
  };

  const currentLanguage =
    languages.find((item) => item.code === language) || languages[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        languages,
        currentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
};

