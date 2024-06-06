import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../Components/Buttons';
import { Header } from '../../Components/Headers';
import { AppLoader } from '../../Components/Loaders';
import { BoldText, MediumText, RegularText } from '../../Components/Texts';
import { useAppDispatch, useAppSelector } from '../../Hooks/RTKHooks';
import { fileGetData, fileGetDetail } from '../../Store/FileSlice';
import { FileDetailFields } from '../../Models/File';
import {
  rateCheckFile,
  rateGetData,
  rateOfficer,
  rateOfficerParams,
} from '../../Store/RateSlice';
import { authGetUserData } from '../../Store/AuthSlice';
import Colors from '../../Themes/Colors';
import Layout from '../../Themes/Layout';
import { formatDate, formatDateMonth } from '../../Utils/Common';
import {
  kScaledSize,
  kSpacing,
  kTextSizes,
  kWidth,
} from '../../Utils/Constants';
import { handleAlert } from '../../Utils/Notification';
import QuestionItem from './QuestionItem';
import moment from 'moment';
import SoundPlayer from 'react-native-sound-player';
import Modal from 'react-native-modal';
import { useStateWithCallback } from '../../Hooks/useStateWithCallback';

const QuestionAnswer = [
  {
    id: 1,
    name: 'Không hài lòng',
    icon: require('../../Assets/Images/notSatisfied.png'),
  },
  {
    id: 2,
    name: 'Bình thường',
    icon: require('../../Assets/Images/normal.png'),
  },
  {
    id: 3,
    name: 'Hài lòng',
    icon: require('../../Assets/Images/satisfied.png'),
  },
  {
    id: 4,
    name: 'Rất hài lòng',
    icon: require('../../Assets/Images/verySatisfied.png'),
  },
];
//logic màn rating -->
const RateScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const {
    fileList,
    fileListData2,
    isLoading: fileLoading,
    totalPages,
  } = useAppSelector((state) => state.files);

  const [page, setPage] = useState<number>(0);

  // const fileDetail: FileDetailFields = params.item;
  const { fileDetail } = useAppSelector((state) => state.files);
  const { data, isLoading, error } = useAppSelector((state) => state.rate);
  const [isShowAlert, setIsShowAlert] = useStateWithCallback(false);

  const { userData } = useAppSelector((state) => state.auth);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const questionData = data?.questionGroup[0].question[0];
  const [selectAnswer, setSelectAnswer] = useState<number | null>(null);
  const [answerType, setAnswerType] = useStateWithCallback(null);

  const ref = useRef<any>(null);

  const onGetFileList = async (reload?: boolean): Promise<void> => {
    const response = await dispatch(
      fileGetData({
        page: reload ? 0 : page,
        size: 10,
        spec: 'page',
        'user-id': userData.user_id,
        userId: userData.id,
        agencyId: userData.experience[0].agency.id,
        //thêm trường ancestor thay trường agency
        ancestorId: userData.experience[0].agency.parent.id,
        ratingId: data?.id,
      }),
    ).unwrap();
    console.log('USERDATA', userData);
    // const latestItem = response.content.reduce(
    //   (
    //     a: { completedDate: string | number | Date },
    //     b: { completedDate: string | number | Date },
    //   ) => {
    //     return moment(a.completedDate) > moment(b.completedDate) ? a : b;
    //   },
    // );
    await dispatch(fileGetDetail({ code: response.content[0].code })).unwrap();
  };

  const renderIcon = (type: number): any => {
    switch (type) {
      case 0:
        return require('../../Assets/Images/normal.png');
      case 2:
        return require('../../Assets/Images/verySatisfied.png');
      case -1:
        return require('../../Assets/Images/notSatisfied.png');
      case 1:
        return require('../../Assets/Images/satisfied.png');

      default:
        return require('../../Assets/Images/normal.png');
    }
  };

  let timeout: any;

  const goBack = () => {
    setIsShowAlert(false, () => {
      navigation.navigate('UserScreen', { item: undefined });
    });
  };

  const onRating = async (answerTypeId: number): Promise<void> => {
    console.log('AHUHU', fileListData2);

    let formatAnswer: Array<any> = [];
    // console.log('selectAnswer câu hỏi@@', selectAnswer);
    questionData?.answer.map((item, index) =>
      formatAnswer.push({
        ...item,
        chosen: item.answerType === answerTypeId ? 1 : 0,
      }),
    );
    // console.log('questiondata', questionData);
    let body: rateOfficerParams;
    if (data) {
      console.log('datadata', data);
      body = {
        formData: {
          participantName: fileListData2?.fullName,
          identityNumber: fileListData2?.numberCard,
          profileNumber: fileListData2?.code,
        },
        ratingOfficer: {
          id: data?.id !== undefined ? data?.id : '62938a32e989a810d0f7583f',
          name: data?.name,
          agency: {
            id:
              userData?.experience[0].primary === true
                ? userData?.experience[0].agency.id
                : '',
            // id: data?.experience[0].primary === true ? data.experience[0]
          },
          userGroup: data?.userGroup,
          startDate: data?.startDate,
          endDate: data?.endDate,
        },
        officer: {
          id: userData?.id,
          name: userData?.fullname,
          // id: fileDetail?.task[fileDetail.task.length - 1].assignee.id,
          // name: fileDetail?.task[fileDetail.task.length - 1].assignee.fullname,
        },
        detail: [
          {
            answer: formatAnswer,
            status: 1,
            question: {
              id: questionData?.id,
              content: questionData?.content,
              multipleChoice: questionData?.multipleChoice,
              requiredChoice: questionData?.requiredChoice,
              status: 1,
              position: 0,
            },
          },
        ],
        deploymentId: data.deploymentId, // có
      };
      console.log('body', body);

      await dispatch(rateOfficer(body)).unwrap();
      if (Platform.OS === 'android') {
        SoundPlayer.playSoundFile('tone', 'mp3');
      }
      setIsShowAlert(true);
      setTimeout(() => {
        goBack();
      }, 3000);
    }
  };
  // data bộ câu hỏi cần push console.log("DATA status ####", questionData);
  // console.log("selection ->", selectAnswer, answerType);
  const onScrollToIndex = (type: string): void => {
    if (
      type === 'next' &&
      data &&
      questionIndex < data?.questionGroup[0].question.length - 1
    ) {
      ref.current?.scrollToIndex({ animated: true, index: questionIndex + 1 });
      setQuestionIndex(questionIndex + 1);
    } else if (type === 'previous' && questionIndex > 0) {
      ref.current?.scrollToIndex({ animated: true, index: questionIndex - 1 });
      setQuestionIndex(questionIndex - 1);
    }
  };

  const onGetData = async (): Promise<void> => {
    dispatch(rateGetData({ page: 0, size: 1, status: 1 })).unwrap();
  };

  useEffect(() => {
    onGetData();
  }, []);

  useEffect(() => {
    timeout = setTimeout(() => {
      console.log('still run');
      // navigation.navigate('UserScreen', { item: fileDetail });
      navigation.navigate('UserScreen');
    }, 15 * 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);
  // console.log('file dsss', fileDetail);
  console.log('AHUHU', fileListData2);
  console.log('AHUHUdata', data);
  console.log('USERDATA', userData);
  return (
    <View style={[Layout.fill]}>
      <Header name='ĐÁNH GIÁ ĐỘ HÀI LÒNG' />
      {/* {(isLoading || fileLoading) && <AppLoader />} */}
      {fileListData2 && !error ? (
        <>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/**test show hồ sơ*/}
            <View
              style={[
                Layout.rowBetween,
                styles.mb,
                {
                  marginHorizontal: kSpacing.kSpacing20,
                  marginTop: kSpacing.kSpacing10,
                },
              ]}
            >
              <RegularText>Mã hồ sơ</RegularText>
              <MediumText style={styles.detail}>
                {fileListData2 && fileListData2?.code}
              </MediumText>
            </View>
            <View
              style={{
                marginHorizontal: kSpacing.kSpacing16,
                marginVertical: kSpacing.kSpacing10,
              }}
            >
              <MediumText style={[styles.title]}>
                MỜI CHẠM VÀO BIỂU TƯỢNG ĐỂ ĐÁNH GIÁ
              </MediumText>
            </View>
            <View
              style={[
                Layout.center,
                {
                  marginBottom: kSpacing.kSpacing20,
                  marginHorizontal: kSpacing.kSpacing10,
                },
              ]}
            >
              {questionData &&
                questionData.answer
                  .slice()
                  .sort((a, b) => a.answerType - b.answerType)
                  .reverse()
                  .map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setSelectAnswer(index);
                        // console.log("check ne", item.answerType);
                        setAnswerType(item.answerType, () => {
                          onRating(item.answerType);
                        });
                      }}
                      style={[
                        styles.moodv2,
                        {
                          backgroundColor:
                            selectAnswer === index
                              ? Colors.primary
                              : Colors.white,
                        },
                        Layout.shadow,
                      ]}
                    >
                      <Image
                        source={renderIcon(item.answerType)}
                        style={styles.moodIconv2}
                      />
                      <RegularText
                        style={[
                          styles.moodTextv2,
                          {
                            color:
                              selectAnswer === index
                                ? Colors.white
                                : Colors.black,
                          },
                        ]}
                      >
                        {item.content}
                      </RegularText>
                    </TouchableOpacity>
                  ))}
            </View>
          </ScrollView>
          {/* <View style={styles.buttonGroup}>
            <Button title="Hoàn tất" onPress={onRating} />
          </View> */}
        </>
      ) : (
        <View style={[Layout.fill, Layout.center]}>
          <MediumText>Không có hồ sơ đánh giá</MediumText>
        </View>
      )}
      <Modal
        animationIn={'zoomIn'}
        animationOut={'zoomOut'}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        isVisible={isShowAlert}
        backdropOpacity={0.7}
      >
        <View style={styles.modal}>
          <View style={[styles.modalContainer]}>
            <BoldText style={styles.noti}>Thông Báo</BoldText>
            <MediumText style={styles.message}>
              CẢM ƠN ÔNG/BÀ ĐÃ ĐÁNH GIÁ KẾT QUẢ GIẢI QUYẾT HỒ SƠ{' '}
              <MediumText style={styles.detail}>{fileDetail?.code}</MediumText>
            </MediumText>

            {/* <TouchableOpacity
              onPress={goBack}
              style={[styles.result, { backgroundColor: Colors.primary }]}
            >
              <RegularText style={styles.textBold}>Đóng</RegularText>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  title: {
    marginVertical: kSpacing.kSpacing10,
    color: Colors.primary,
    textAlign: 'center',
    fontSize: kTextSizes.medium,
  },
  detail: {
    flex: 1,
    textAlign: 'right',
    color: Colors.black,
  },
  buttonGroup: {
    paddingHorizontal: kSpacing.kSpacing20,
    marginBottom: kScaledSize(20),
    marginTop: kScaledSize(5),
  },
  officer: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: Colors.grey7,
    marginHorizontal: kSpacing.kSpacing10,
    backgroundColor: Colors.white,
  },
  name: {
    color: Colors.orange2,
  },
  mb: {
    marginBottom: kSpacing.kSpacing10,
  },
  mood: {
    width: (kWidth - kScaledSize(40)) / 4,
    borderRadius: 5,
  },
  moodv2: {
    width: kWidth - kScaledSize(40),
    paddingVertical: kScaledSize(10),
    marginBottom: kSpacing.kSpacing25,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodText: {
    fontSize: kTextSizes.xmini,
    textAlign: 'center',
    marginTop: kSpacing.kSpacing10,
  },
  moodTextv2: {
    fontSize: kTextSizes.large,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  moodIcon: {
    width: (kWidth - kScaledSize(60)) / 4,
    height: kScaledSize(45),
    resizeMode: 'contain',
  },
  moodIconv2: {
    width: (kWidth - kScaledSize(60)) / 3,
    height: kScaledSize(60),
    resizeMode: 'contain',
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
  noti: {
    textAlign: 'center',
    marginBottom: kScaledSize(20),
    color: Colors.primary,
    fontSize: kScaledSize(20),
  },
  message: { textAlign: 'center' },
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
});

export default RateScreen;
