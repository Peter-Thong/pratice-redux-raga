import { put, delay, call } from "redux-saga/effects";
import * as actions from "../actions/index";
import axios from "axios";

export function* logoutSaga(action) {
  yield call([localStorage, "removeItem"], "token");
  yield call([localStorage, "removeItem"], "userId");
  yield call([localStorage, "removeItem"], "expirationDate");
  yield put(actions.logoutSucceed());
}

export function* checkAuthTimeoutSaga(action) {
  yield delay(action.expirationTime * 1000);
  yield put(actions.authLogout());
}

export function* authUserSaga(action) {
  yield put(actions.authStart());
  const authData = {
    email: action.email,
    password: action.password,
    returnSecureToken: true,
  };

  let url =
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyA0iXGVDunUpzvP4IIc5ejnvMwMF08G6is";

  if (!action.isSignUp) {
    url =
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyA0iXGVDunUpzvP4IIc5ejnvMwMF08G6is";
  }
  try {
    const response = yield axios.post(url, authData);

    const expirationDate = yield new Date(
      new Date().getTime() + response.data.expiresIn * 1000
    );
    yield localStorage.setItem("token", response.data.idToken);
    yield localStorage.setItem("userId", response.data.localId);
    yield localStorage.setItem("expirationDate", expirationDate);
    yield put(
      actions.authSuccess(response.data.idToken, response.data.localId)
    );
    yield put(actions.checkAuthTimeout(response.data.expiresIn));
  } catch (error) {
    put(actions.authFail(error.response.data.error));
  }
}

export function* authCheckStateSaga(action) {
  const token = yield localStorage.getItem("token");
  if (!token) {
    yield put(actions.authLogout());
  } else {
    const expirationDate = yield new Date(
      localStorage.getItem("expirationDate")
    );
    if (expirationDate > new Date()) {
      const userId = yield localStorage.getItem("userId");
      yield put(actions.authSuccess(token, userId));
      yield put(
        actions.checkAuthTimeout(
          (expirationDate.getTime() - new Date().getTime()) / 1000
        )
      );
    } else {
      yield put(actions.authLogout());
    }
  }
}
