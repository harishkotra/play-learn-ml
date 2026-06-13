export const LANGUAGES = {
  en: { label: "EN", name: "English" },
  es: { label: "ES", name: "Español" },
  fr: { label: "FR", name: "Français" },
  zh: { label: "中文", name: "中文" },
};

const translations = {
  en: {
    site: { title: "Play & Learn ML", subtitle: "Interactive ML Playground" },
    nav: {
      home: "Home",
      linearRegression: "Stretchy Rope",
      decisionTrees: "20 Questions",
      kMeans: "Magnetic Clusters",
      ensemble: "Jury Room",
      neuralNetworks: "Lego Blocks",
      gradientDescent: "Roller Coaster",
      confusionMatrix: "Sorting Machine",
      overfitting: "Emperor's Tailor",
      logisticRegression: "Probability Seesaw",
      pca: "Shadow Puppets",
      svm: "Tug-of-War",
      naiveBayes: "Spam or Not",
      tsne: "Unfolding Origami",
    },
    levels: {
      title: "Levels",
      level: "Level",
      complete: "Level Complete! 🎉",
      next: "Next Level →",
      ready: (next) => `Ready for "${next}"?`,
      mastered: "You've mastered all levels!",
      locked: "Complete previous level to unlock",
    },
    guide: {
      definition: "Definition",
      how: "How it works",
      why: "Why it matters",
      what: "What to do",
    },
    controls: {
      reset: "Reset",
      play: "Play",
      pause: "Pause",
      fit: "Fit Model",
    },
  },
  es: {
    site: {
      title: "Juega y Aprende ML",
      subtitle: "Laboratorio Interactivo de ML",
    },
    nav: {
      home: "Inicio",
      linearRegression: "Cuerda Elástica",
      decisionTrees: "20 Preguntas",
      kMeans: "Clústeres Magnéticos",
      ensemble: "Sala del Jurado",
      neuralNetworks: "Bloques Lego",
      gradientDescent: "Montaña Rusa",
      confusionMatrix: "Máquina Clasificadora",
      overfitting: "Sastre del Emperador",
      logisticRegression: "Sube-Baja de Probabilidad",
      pca: "Títeres de Sombra",
      svm: "Tira y Afloja",
      naiveBayes: "Spam o No",
      tsne: "Origami Desplegable",
    },
    levels: {
      title: "Niveles",
      level: "Nivel",
      complete: "¡Nivel Completado! 🎉",
      next: "Siguiente Nivel →",
      ready: (next) => `¿Listo para "${next}"?`,
      mastered: "¡Has dominado todos los niveles!",
      locked: "Completa el nivel anterior para desbloquear",
    },
    guide: {
      definition: "Definición",
      how: "Cómo funciona",
      why: "Por qué importa",
      what: "Qué hacer",
    },
    controls: {
      reset: "Reiniciar",
      play: "Jugar",
      pause: "Pausa",
      fit: "Ajustar Modelo",
    },
  },
  fr: {
    site: {
      title: "Jouez et Apprenez le ML",
      subtitle: "Terrain de Jeu ML Interactif",
    },
    nav: {
      home: "Accueil",
      linearRegression: "Corde Élastique",
      decisionTrees: "20 Questions",
      kMeans: "Amas Magnétiques",
      ensemble: "Salle du Jury",
      neuralNetworks: "Blocs Lego",
      gradientDescent: "Montagnes Russes",
      confusionMatrix: "Machine à Trier",
      overfitting: "Tailleur de l'Empereur",
      logisticRegression: "Balançoire de Probabilité",
      pca: "Ombres Chinoises",
      svm: "Tir à la Corde",
      naiveBayes: "Spam ou Pas",
      tsne: "Origami qui se Déplie",
    },
    levels: {
      title: "Niveaux",
      level: "Niveau",
      complete: "Niveau Terminé ! 🎉",
      next: "Niveau Suivant →",
      ready: (next) => `Prêt pour "${next}" ?`,
      mastered: "Vous avez maîtrisé tous les niveaux !",
      locked: "Terminez le niveau précédent pour débloquer",
    },
    guide: {
      definition: "Définition",
      how: "Comment ça marche",
      why: "Pourquoi c'est important",
      what: "Que faire",
    },
    controls: {
      reset: "Réinitialiser",
      play: "Jouer",
      pause: "Pause",
      fit: "Ajuster le Modèle",
    },
  },
  zh: {
    site: { title: "玩转机器学习", subtitle: "交互式机器学习实验室" },
    nav: {
      home: "首页",
      linearRegression: "弹性绳索",
      decisionTrees: "二十个问题",
      kMeans: "磁力聚类",
      ensemble: "陪审团",
      neuralNetworks: "乐高积木",
      gradientDescent: "过山车",
      confusionMatrix: "分类机",
      overfitting: "皇帝的新裁缝",
      logisticRegression: "概率跷跷板",
      pca: "皮影戏",
      svm: "拔河比赛",
      naiveBayes: "垃圾邮件与否",
      tsne: "展开折纸",
    },
    levels: {
      title: "关卡",
      level: "关卡",
      complete: "关卡完成！🎉",
      next: "下一关 →",
      ready: (next) => `准备好了"${next}"吗？`,
      mastered: "你已经掌握了所有关卡！",
      locked: "完成前一关以解锁",
    },
    guide: {
      definition: "定义",
      how: "工作原理",
      why: "为什么重要",
      what: "操作指南",
    },
    controls: { reset: "重置", play: "播放", pause: "暂停", fit: "拟合模型" },
  },
};

export function t(key, locale = "en", ...args) {
  const keys = key.split(".");
  let val = translations[locale];
  for (const k of keys) {
    if (val && typeof val === "object" && k in val) val = val[k];
    else return key;
  }
  return typeof val === "function" ? val(...args) : val;
}

export function getTranslation(locale) {
  return {
    t: (key, ...args) => t(key, locale, ...args),
    locale,
  };
}
