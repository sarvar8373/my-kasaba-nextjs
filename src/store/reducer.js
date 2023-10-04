import { localStorage } from "@/utils/window";
import { LOGIN_SUCCESS, LOGIN_FAILURE, SHOW_LOADING, CACHES, IS_MEMBER } from "./actions";

const initialState = {
  isLoggedIn: !!localStorage.getItem("token") || false,
  showLoading: false,
  isMember: false,
  caches: {},
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        isLoggedIn: true,
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        isLoggedIn: false,
      };
    case SHOW_LOADING:
      return {
        ...state,
        showLoading: action.payload,
      };
    case CACHES:
      return {
        ...state,
        caches: action.payload,
      };
    case IS_MEMBER:
      return {
        ...state,
        isMember: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
