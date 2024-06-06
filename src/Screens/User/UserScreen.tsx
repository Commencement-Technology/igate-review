import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import React, { useEffect, useState, useLayoutEffect } from 'react';
import Layout from '../../Themes/Layout';
import { Header } from '../../Components/Headers';
import { useAppSelector, useAppDispatch } from '../../Hooks/RTKHooks';
import { BoldText, MediumText, RegularText } from '../../Components/Texts';
import { kScaledSize, kSpacing, kTextSizes } from '../../Utils/Constants';
import Colors from '../../Themes/Colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  authGetToken,
  authGetTokenBackground,
  authLogout,
} from '../../Store/AuthSlice';
import { useIsFocused, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  fileGetData,
  fileGetDetail,
  fileGetData2,
} from '../../Store/FileSlice';
import { AppLoader } from '../../Components/Loaders';
import { rateCheckFile } from '../../Store/RateSlice';
import _ from 'lodash';
import { rateGetData } from '../../Store/RateSlice';
import { GetUserIMAGE, fileGetUSERIMG } from '../../Store/AuthSlice';
type Props = {
  navigation: any;
};
const UserScreen = (props: Props) => {
  //gọi userdate là dữ liêụ lấy từ state auth về.
  const { userData, userCredential } = useAppSelector((state) => state.auth);
  const { avatarDataIMG } = useAppSelector((state) => state.auth);
  // const { userIMGData } = useAppSelector((state) => state.auth);
  const { isLoading: fileLoading } = useAppSelector((state) => state.files);
  const [isloading, setIsloading] = useState<boolean>(true);
  const { data } = useAppSelector((state) => state.rate);
  const [userImage, setUserImage] = useState('');
  // console.log('dataapapa', userData);
  // console.log('datahihu', data);
  // console.log('imggg', userIMGData);
  const focus = useIsFocused();
  const route: any = useRoute();

  const dispatch = useAppDispatch();

  const [isShowAlert, setIsShowAlert] = useState(false);

  const onGetData = async (): Promise<void> => {
    dispatch(
      rateGetData({ page: 0, size: 1, status: 1, spec: 'page' }),
    ).unwrap();
  };
  // const onGetIMG = async (): Promise<void> => {
  //   dispatch(GetUserIMAGE({ avatarId: userData.avatarId })).unwrap();
  // };
  // console.log('anhtravess', userData.avatarId);

  //VER02 LAY AVATAR
  console.log('baba-->', avatarDataIMG);
  const avatarId: any = userData.avatarId;
  console.log('abcabcabc222', userData.avatarId);
  const onGetIMGAVATAR = async (): Promise<void> => {
    try {
      setIsloading(true);
      const response = await dispatch(fileGetUSERIMG({ avatarId })).unwrap();
      setUserImage((pre) => response);
      console.log('dataRP', response);
      console.log('dataRP02', userImage);
    } catch (error) {
      console.log(error);
    } finally {
      setIsloading(false);
    }
  };
  console.log('dataRP03', userImage);
  // console.log("dữ liệu userData", userData, userCredential);
  //lấy dữ liệu ở màn hình user về.
  const onGetFileList = async (reload?: boolean): Promise<void> => {
    //Hàm lấy dữ liệu toàn bộ hồ sơ (trạng thái trả kết quả) của Cán Bộ.
    //console.log('Route FileFields', route.params);
    console.log('1234321', userData);
    const response = await dispatch(
      fileGetData({
        page: 0,
        size: 50,
        spec: 'page',
        'user-id': userData.user_id, //undefine
        userId: userData.id,
        agencyId: userData.experience[0].agency.id,
        //thêm trường ancestor
        ancestorId: userData.experience[0].agency.parent.id
          ? userData.experience[0].agency.parent.id
          : userData.experience[0].agency.ancestors[0].id, // cua hue null
        ratingId: userData.user_id,
        //cần call trường nào thì từ màn user -> đẩy những thông tin cần thiết vô file slice để gọi api
      }),
    ).unwrap();
    const fileDetail = await dispatch(
      fileGetDetail({ code: response.content[0].code }),
    ).unwrap();
    // Check hồ sơ đã đánh giá hay chưa
    //logic -> nếu chi tiết hồ sơ có tồn tại content -> truyền vào params -> nếu content > 0 đã có đánh giá rồi.
    //nếu rỗng -> cho qua màn đánh giá.
    if (
      route.params?.item &&
      _.isEqual(fileDetail.content[0], route.params?.item)
    ) {
      //nếu user không đánh giá trong vòng 15s thì sẽ kiểm tra hồ sơ, nếu ko có hồ sơ mới thì ko qua đánh giá
      return;
    }
    // console.log('tontaidetail', fileDetail);
    if (fileDetail) {
      console.log(
        'offficerid',
        fileDetail.content[0].task[fileDetail.content[0].task.length - 1]
          .assignee.id,
      );
      console.log('code_id', fileDetail.content[0]?.code);
      const fileCheck = await dispatch(
        rateCheckFile({
          //new
          'rating-id': data?.id, //true
          // 'rating-id': fileDetail.content[0]?.id,
          'officer-id':
            fileDetail.content[0]?.task[fileDetail.content[0].task.length - 1]
              .assignee.id, //true
          'dossier-id': fileDetail.content[0]?.code, //true
          //old
          // "rating-id": fileDetail.content[0]?.id,
          // "officer-id": fileDetail.content[0]?.applicant.userId,
          // //lấy từ api chi tiết hồ sơ : previoustask.assignee.id
          // "dossier-id": fileDetail.content[0]?.code,
        }),
      ).unwrap();
      console.log('chay vao day ...');
      // console.log("zzzz", fileCheck);
      // console.log("zzzzfileCheck.content.length", fileCheck.content.length);
      if (fileCheck.content.length > 0) {
        // Show thông báo đã được đánh giá
        console.log('chay vao day ___');
        setIsShowAlert(true);
        // setTimeout(() => setIsShowAlert(false), 3000);
      } else {
        props.navigation.navigate('RatingScreen');
        console.log('chay vao day ***');
      }
    }
  };

  const onGetFileList2 = async (reload?: boolean): Promise<void> => {
    //Hàm lấy dữ liệu toàn bộ hồ sơ (trạng thái trả kết quả) của Cán Bộ.
    console.log('@@', userData);
    console.log('@@1', data);
    const response = await dispatch(
      fileGetData2({
        userId: userData.id,
        ratingId:
          data?.id !== undefined ? data?.id : '62938a32e989a810d0f7583f', // dangbinull
        //không sử dụng mấy file ở dưới
        'user-id': '',
        agencyId: '',
        ancestorId: '',
        // 'user-id': userData.user_id,
        // agencyId: userData.experience[0].agency.id,
        // ancestorId: userData.experience[0].agency.parent.id
        //   ? userData.experience[0].agency.parent.id
        //   : userData.experience[0].agency.ancestors[0].id,
      }),
    ).unwrap();
    if (response.code !== null) {
      props.navigation.navigate('RatingScreen');
    }
    console.log('hoann', response);
    // const fileDetail = await dispatch(
    //   fileGetDetail({ code: response.content[0].code }),
    // ).unwrap();
    // Check hồ sơ đã đánh giá hay chưa
    //logic -> nếu chi tiết hồ sơ có tồn tại content -> truyền vào params -> nếu content > 0 đã có đánh giá rồi.
    //nếu rỗng -> cho qua màn đánh giá.
    // if (
    //   route.params?.item &&
    //   _.isEqual(fileDetail.content[0], route.params?.item)
    // ) {
    //   //nếu user không đánh giá trong vòng 15s thì sẽ kiểm tra hồ sơ, nếu ko có hồ sơ mới thì ko qua đánh giá
    //   return;
    // }
    // console.log('tontaidetail', fileDetail);
    // if (fileDetail) {
    //   console.log(
    //     'offficerid',
    //     fileDetail.content[0].task[fileDetail.content[0].task.length - 1]
    //       .assignee.id,
    //   );
    //   console.log('code_id', fileDetail.content[0]?.code);
    //   const fileCheck = await dispatch(
    //     rateCheckFile({
    //       //new
    //       'rating-id': data?.id, //true
    //       // 'rating-id': fileDetail.content[0]?.id,
    //       'officer-id':
    //         fileDetail.content[0]?.task[fileDetail.content[0].task.length - 1]
    //           .assignee.id, //true
    //       'dossier-id': fileDetail.content[0]?.code, //true
    //     }),
    //   ).unwrap();
    //   console.log('chay vao day ...');
    //   if (fileCheck.content.length > 0) {
    //     console.log('chay vao day ___');
    //     setIsShowAlert(true);
    //   } else {
    //     props.navigation.navigate('RatingScreen');
    //     console.log('chay vao day ***');
    //   }
    // }
  };

  const onLogout = (): void => {
    Alert.alert('Thông báo', 'Bạn có muốn đăng xuất không?', [
      {
        text: 'Đồng ý',
        onPress: () => dispatch(authLogout()),
      },
      {
        text: 'Huỷ',
      },
    ]);
  };
  const onGetToken = async (): Promise<void> => {
    console.log('focus run');
    await dispatch(authGetTokenBackground(userCredential)).unwrap();
  };

  useEffect(() => {
    let interval: any;
    if (focus) {
      interval = setInterval(() => {
        onGetToken();
        // onGetIMGAVATAR();
      }, 5 * 60 * 1000);
      // onGetToken();
    }
    return () => clearInterval(interval);
  }, [focus]);

  useEffect(() => {
    if (focus) {
      let interval: any;
      interval = setInterval(() => {
        // onGetFileList();
        onGetFileList2();
        onGetData();
        // onGetIMG();
        //onGetIMGAVATAR();
      }, 7 * 1000);
      return () => clearInterval(interval);
    }
  }, [focus]);

  useEffect(() => {
    onGetIMGAVATAR();
  }, [userData]);

  console.log('usoimage', userImage);
  return (
    <View style={[Layout.fill]}>
      {/* <Header
        name="THÔNG TIN CÁN BỘ"
        showBackButton={false}
        // logout
        // onLogout={onLogout}
      /> */}
      {fileLoading && <AppLoader />}
      <ScrollView style={[Layout.fill]}>
        <View style={styles.titleWrapper}>
          <RegularText style={styles.title}>
            ĐỂ CẢI THIỆN CHẤT LƯỢNG PHỤC VỤ NGƯỜI DÂN, TỔ CHỨC NGÀY MỘT TỐT HƠN,
            XIN ÔNG/BÀ VUI LÒNG ĐÁNH GIÁ GIÚP QUÁ TRÌNH TIẾP NHẬN HỒ SƠ VÀ GIẢI
            QUYẾT TTHC CỦA ÔNG/BÀ.
          </RegularText>
        </View>
        <View style={[Layout.fill, styles.container]}>
          <View style={[styles.user, Layout.shadow]}>
            <View style={[styles.avatar, Layout.center]}>
              {/* <FontAwesome name='user' size={kScaledSize(40)} /> */}
              {userImage ? (
                <Image
                  style={styles.tinyLogo}
                  source={{
                    //uri: `https://apiigate.quangngai.gov.vn/fi/file/${userData.avatarId}`,
                    uri: `${String(userImage)}`,
                    //userImage STATE
                  }}
                />
              ) : (
                <FontAwesome name='user' size={kScaledSize(40)} />
              )}
            </View>
            <View style={styles.info}>
              <View style={[styles.detail]}>
                <RegularText>Công chức TN và TKQ hồ sơ:</RegularText>
                <MediumText>{userData.fullname}</MediumText>
              </View>
              {/**email */}
              <View style={[styles.detail]}>
                <RegularText>Email: </RegularText>
                <MediumText>
                  {/**check tránh lỗi email. */}
                  {userData.email.length > 0 ? userData.email[0].value : ''}
                </MediumText>
              </View>
              {userData.experience[0].primary && (
                <View style={[styles.detail]}>
                  <RegularText>Cơ quan: </RegularText>
                  <MediumText>
                    {userData.experience[0].agency.parent.name
                      ? userData.experience[0].agency.parent.name
                      : ''}
                  </MediumText>
                </View>
              )}
              <View style={[Layout.rowBetween]}>
                <MediumText>Đăng xuất</MediumText>
                <TouchableOpacity onPress={onLogout}>
                  <MaterialIcons name='logout' size={kScaledSize(25)} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.complete, Layout.center]}>
          <Icon
            name='checkmark-circle'
            size={kScaledSize(100)}
            color={'green'}
          />
          <BoldText
            style={[
              {
                color: Colors.primary,
                marginTop: kScaledSize(10),
                marginBottom: kScaledSize(10),
                textAlign: 'center',
              },
            ]}
          >
            TRUNG TÂM PHỤC VỤ - KIỂM SOÁT THỦ TỤC HÀNH CHÍNH TỈNH QUẢNG NGÃI
          </BoldText>
          <BoldText style={{ textAlign: 'center' }}>
            TRÂN TRỌNG CẢM ƠN ÔNG/BÀ ĐÃ DÀNH THỜI GIAN ĐÁNH GIÁ
          </BoldText>
          {/* <TouchableOpacity
            onPress={() => onGetFileList()}
            style={[styles.result, { backgroundColor: Colors.primary }]}
          >
            <RegularText style={styles.textBold}>ĐÁNH GIÁ HỒ SƠ</RegularText>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
      {/* <Modal
        animationIn={"zoomIn"}
        animationOut={"zoomOut"}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        isVisible={isShowAlert}
        backdropOpacity={0.7}
      >
        <View style={styles.modal}>
          <View style={[styles.modalContainer]}>
            <BoldText style={styles.noti}>Thông Báo</BoldText>
            <MediumText style={styles.message}>
              Hồ sơ này đã được đánh giá
            </MediumText>
            <TouchableOpacity
              onPress={() => setIsShowAlert(false)}
              style={[styles.result, { backgroundColor: Colors.primary }]}
            >
              <RegularText style={styles.textBold}>Đóng</RegularText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
    </View>
  );
};

export default UserScreen;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: kScaledSize(15),
    transform: [{ translateY: kScaledSize(-30) }],
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    minHeight: kScaledSize(100),
    borderRadius: kScaledSize(10),
    padding: kScaledSize(10),
  },
  user: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: kScaledSize(15),
    flexDirection: 'row',
  },
  info: {
    flex: 1,
    marginLeft: kScaledSize(20),
  },
  titleWrapper: {
    paddingTop: kScaledSize(20),
    paddingBottom: kScaledSize(40),
    paddingHorizontal: kScaledSize(20),
    backgroundColor: Colors.primary,
  },
  title: {
    textAlign: 'center',
    color: Colors.white,
  },
  textBold: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  result: {
    marginTop: kScaledSize(30),
    alignSelf: 'center',
    paddingVertical: kSpacing.kSpacing10,
    paddingHorizontal: kSpacing.kSpacing20,
    borderRadius: 5,
  },
  avatar: {
    height: kScaledSize(80),
    width: kScaledSize(75),
    backgroundColor: Colors.grey7,
    borderRadius: kScaledSize(5),
  },
  detail: {
    marginBottom: kScaledSize(10),
    borderBottomWidth: 1,
    paddingBottom: kScaledSize(5),
  },
  complete: {
    marginHorizontal: kScaledSize(30),
  },
  noti: {
    textAlign: 'center',
    marginBottom: kScaledSize(20),
    color: Colors.primary,
    fontSize: kScaledSize(20),
  },
  message: { textAlign: 'center' },
  tinyLogo: {
    width: 80,
    height: 95,
  },
});
