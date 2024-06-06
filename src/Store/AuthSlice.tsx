import AsyncStorage from '@react-native-community/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { requestGet, requestPostXform } from '../Services/ApiCall';
import {
  checkTokenExpired,
  removeFromStorage,
  saveToStorage,
} from '../Utils/Common';
import { handleAlert } from '../Utils/Notification';
import jwtDecode from 'jwt-decode';

export interface initialStateFields {
  token: string;
  refreshToken: string;
  isLogin: boolean;
  isLoading: boolean;
  userData: any;
  userCredential: any;
  error: boolean;
  userIMGData: any;
  avatarDataIMG: any;
}

interface authTokenParams {
  client_id: string;
  grant_type: string;
  scope: string;
  username: string;
  password: string;
}

export const authGetToken = createAsyncThunk(
  'auth/get_token',
  async (fields: authTokenParams, { rejectWithValue, dispatch }) => {
    const forceLogout = () => {
      dispatch(onLogout());
    };
    try {
      const response = await requestPostXform(
        'auth/realms/digo/protocol/openid-connect/token',
        {
          data: fields,
          needToken: false,
        },
      );

      await saveToStorage('userCredential', JSON.stringify(fields));
      return {
        res: response.data,
        userCredential: fields,
      };
    } catch (error: any) {
      console.log(error.response);
      handleAlert({
        message:
          error.response === undefined
            ? 'Cố lỗi xẩy ra'
            : 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
      return rejectWithValue(error);
    }
  },
);
export const authGetTokenBackground = createAsyncThunk(
  'auth/get_token_background',
  async (fields: authTokenParams, { rejectWithValue, dispatch }) => {
    const forceLogout = () => {
      dispatch(onLogout());
    };
    try {
      const response = await requestPostXform(
        'auth/realms/digo/protocol/openid-connect/token',
        {
          data: fields,
          needToken: false,
        },
      );
      console.log('get token bg', response.data);
      return response.data;
    } catch (error: any) {
      console.log(error.response);
      handleAlert({
        message:
          error.response === undefined
            ? 'Cố lỗi xẩy ra'
            : 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
      return rejectWithValue(error);
    }
  },
);
//hàm lấy api của từng cá nhân
export const authGetUserData = createAsyncThunk(
  'auth/get_user_data',
  async (userId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await requestGet(`hu/user/${userId}/--fully`, {
        needToken: true,
      });
      //?user-id=${userId}
      console.log('123', response.data);
      //lấy dữ liệu lưu dữ liệu userData ở storage.
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.log(error.response);
      handleAlert({
        message:
          error.response === undefined
            ? 'Cố lỗi xẩy ra'
            : 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
      return rejectWithValue(error);
    }
  },
);
//hàm lấy ảnh của cá nhân
export const GetUserIMAGE = createAsyncThunk(
  'auth/get_user_image',
  async (avatarId: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await requestGet(`fi/file/${avatarId}`, {
        needToken: true,
      });
      console.log('anhdaidieniss', response.data);
      return response.data;
    } catch (error: any) {
      console.log(error.response);
      handleAlert({
        message:
          error.response === undefined
            ? 'Cố lỗi xẩy ra'
            : 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
      return rejectWithValue(error);
    }
  },
);
//Lấy ảnh ver2
export const fileGetUSERIMG = createAsyncThunk(
  'file/get_user_img',
  async (fields: any, { rejectWithValue, dispatch }) => {
    const forceLogout = () => {
      dispatch(onLogout());
    };
    console.log('fields2222', fields);
    try {
      const response = await requestGet(`fi/file/${fields.avatarId}`, {
        // params: fields,
        needToken: true,
      });
      console.log('imgimgimg', response.config.url);
      return response.config.url;
    } catch (error: any) {
      console.log('error', error);
      if (error.response.status === 401) {
        handleAlert({
          message: 'Hết phiên đăng nhập, vui lòng đăng nhập lại',
          onPress1: forceLogout,
        });
      }
      return rejectWithValue(error);
    }
  },
);

export const authCheckLogin = createAsyncThunk(
  'auth/check_login',
  async (_, { rejectWithValue }) => {
    try {
      const token: any = await AsyncStorage.getItem('authToken');
      const userData: any = await AsyncStorage.getItem('userData');
      const userCredential: any = await AsyncStorage.getItem('userCredential');
      // if (token) {
      //   const isTokenExpire = checkTokenExpired(token);
      //   return { isTokenExpire, token, userData };
      // } else {
      //   return { isTokenExpire: true };
      // }
      if (userData) {
        const isTokenExpire = false;
        return { isTokenExpire, token, userData, userCredential };
      }
      return { isTokenExpire: true };
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const authLogout = createAsyncThunk(
  'auth/auth_logout',
  async (_, { rejectWithValue }) => {
    try {
      removeFromStorage('authToken');
      removeFromStorage('refreshToken');
      removeFromStorage('userData');
      removeFromStorage('userCredential');
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

const AuthSlice = createSlice({
  name: 'auth',
  initialState: {
    token: '',
    refreshToken: '',
    isLogin: false,
    isLoading: false,
    error: false,
  } as initialStateFields,
  reducers: {
    onLogout: (state: initialStateFields) => {
      state.isLogin = false;
      state.token = '';
      state.refreshToken = '';
    },
  },
  extraReducers: (builder) => {
    // Check Token Expire to Keep Login
    builder.addCase(authLogout.fulfilled, (state, action) => {
      state.isLogin = false;
      state.token = '';
      state.refreshToken = '';
    });
    builder.addCase(authGetToken.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(authGetToken.fulfilled, (state, action) => {
      const { res, userCredential }: any = action.payload;
      const { access_token, refresh_token } = res;
      saveToStorage('authToken', JSON.stringify(access_token));
      saveToStorage('refreshToken', JSON.stringify(refresh_token));
      state.token = access_token;
      state.refreshToken = refresh_token;
      state.userCredential = userCredential;
      // state.isLoading = false;
    });
    builder.addCase(authGetToken.rejected, (state) => {
      state.isLoading = false;
    });
    // Get Token background
    builder.addCase(authGetTokenBackground.fulfilled, (state, action) => {
      const { access_token, refresh_token }: any = action.payload;
      saveToStorage('authToken', JSON.stringify(access_token));
      saveToStorage('refreshToken', JSON.stringify(refresh_token));
      state.token = access_token;
      state.refreshToken = refresh_token;
      // state.isLoading = false;
    });
    builder.addCase(authGetUserData.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(authGetUserData.fulfilled, (state, action) => {
      const userData = action.payload;
      state.userData = userData;
      state.isLoading = false;
      state.isLogin = true;
    });
    builder.addCase(authGetUserData.rejected, (state) => {
      state.isLoading = false;
    });
    //Call IMG
    builder.addCase(GetUserIMAGE.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(GetUserIMAGE.fulfilled, (state, action) => {
      const userIMGData = action.payload;
      state.userIMGData = userIMGData;
      state.isLoading = false;
      state.isLogin = true;
    });
    builder.addCase(GetUserIMAGE.rejected, (state) => {
      state.isLoading = false;
    });
    //CALL IMGV2
    builder.addCase(fileGetUSERIMG.pending, (state) => {
      state.error = false;
    });
    builder.addCase(fileGetUSERIMG.fulfilled, (state, action) => {
      //fulfil call thanh cong (syntax)
      const data: any = action.payload;
      state.avatarDataIMG = data;
    });
    builder.addCase(fileGetUSERIMG.rejected, (state) => {
      state.error = true;
    });

    // Check Token Expire to Keep Login
    builder.addCase(authCheckLogin.fulfilled, (state, action) => {
      const { isTokenExpire, userData, userCredential }: any = action.payload;
      if (!isTokenExpire) {
        const user = JSON.parse(userData);
        const credential = JSON.parse(userCredential);
        state.userCredential = credential;
        state.userData = user;
        state.isLogin = true;
      } else {
        state.isLogin = false;
      }
    });
  },
});

export const { onLogout } = AuthSlice.actions;

export default AuthSlice.reducer;
