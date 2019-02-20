import Vue from "vue";
import { Commit, Dispatch } from "vuex";
import { ipcRenderer } from "electron";
import ipcTypes from "../../../common/ipcTypes";

const MAX_STORE_COUNT = 16;

const state: Yagt.TranslatorHookState = {
  hookInfos: [],
  texts: {},
  toDisplayHookCode: "",
  currentDisplayHookIndex: -1,
  translationsForCurrentIndex: {
    original: "",
    translations: {}
  }
};

const getters = {
  getTextById: (state: Yagt.TranslatorHookState) => (id: number) => {
    return state.texts[id.toString()];
  },
  getLastTextById: (state: Yagt.TranslatorHookState) => (id: number) => {
    if (state.texts[id.toString()])
      return state.texts[id.toString()][state.texts[id.toString()].length - 1];
    else return "";
  }
};

const mutations = {
  ADD_HOOK(
    state: Yagt.TranslatorHookState,
    payload: { hook: Yagt.TextThread }
  ) {
    state.hookInfos.push(payload.hook);
    state.texts = { ...state.texts, [payload.hook.handle.toString()]: [] };
  },
  SET_HOOK_TEXT(
    state: Yagt.TranslatorHookState,
    payload: { hookNum: number; text: string }
  ) {
    let texts = state.texts[payload.hookNum.toString()];
    texts.push(payload.text);
    if (state.texts[payload.hookNum.toString()].length > MAX_STORE_COUNT) {
      state.texts[payload.hookNum.toString()].shift();
    }
  },
  CHOOSE_HOOK_AS_DISPLAY(
    state: Yagt.TranslatorHookState,
    payload: { hookNum: number }
  ) {
    state.currentDisplayHookIndex = payload.hookNum;
  },
  INIT_DISPLAY_HOOK(
    state: Yagt.TranslatorHookState,
    payload: { code: string }
  ) {
    state.toDisplayHookCode = payload.code;
  },
  SET_TRANSLATION(
    state: Yagt.TranslatorHookState,
    payload: { translations: Yagt.Translations }
  ) {
    state.translationsForCurrentIndex = payload.translations;
  },
  MERGE_TRANSLATION(
    state: Yagt.TranslatorHookState,
    payload: { translation: Yagt.Translations["translations"] }
  ) {
    for (let key in payload.translation) {
      state.translationsForCurrentIndex.translations = {
        ...state.translationsForCurrentIndex.translations,
        ...{ [key]: payload.translation[key] }
      };
    }
  },
  CLEAR_TRANSLATION(state: Yagt.TranslatorHookState) {
    let translations = state.translationsForCurrentIndex.translations;
    for (let key in translations) {
      translations[key] = "...";
    }
  }
};

const actions = {
  addHook(
    { commit }: { commit: Commit; state: Yagt.TranslatorHookState },
    hook: Yagt.TextThread
  ) {
    commit("ADD_HOOK", { hook });
    if (hook.code.toLowerCase() === state.toDisplayHookCode.toLowerCase()) {
      commit("CHOOSE_HOOK_AS_DISPLAY", { hookNum: hook.handle });
      commit("INIT_DISPLAY_HOOK", { code: "" });
    }
  },
  setHookText(
    {
      dispatch,
      commit,
      state
    }: { dispatch: Dispatch; commit: Commit; state: Yagt.TranslatorHookState },
    { hook, text }: { hook: Yagt.TextThread; text: string }
  ) {
    let commonActions = () => {
      commit("SET_HOOK_TEXT", { hookNum: hook.handle, text });
      if (state.currentDisplayHookIndex === hook.handle) {
        commit("CLEAR_TRANSLATION");
        ipcRenderer.send(ipcTypes.REQUEST_TRANSLATION, text);
      }
    };
    if (state.hookInfos.find(h => h.handle === hook.handle) === undefined) {
      dispatch("addHook", hook).then(() => {
        commonActions();
      });
    } else {
      commonActions();
    }
  },
  setTranslation(
    { commit }: { commit: Commit },
    translations: Yagt.Translations
  ) {
    commit("SET_TRANSLATION", { translations });
  },
  mergeTranslation(
    { commit }: { commit: Commit },
    translation: Yagt.Translations["translations"]
  ) {
    commit("MERGE_TRANSLATION", { translation });
  },
  chooseHookAsDisplay({ commit }: { commit: Commit }, hookNum: number) {
    commit("CHOOSE_HOOK_AS_DISPLAY", { hookNum });
  }
};

export default {
  state,
  getters,
  mutations,
  actions
};
