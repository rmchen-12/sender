import Taro, { Component, Config } from "@tarojs/taro";
import {
  View,
  Text,
  Image,
  Swiper,
  SwiperItem,
  Button
} from "@tarojs/components";
import {
  AtButton,
  AtInput,
  AtTabs,
  AtTabsPane,
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtAvatar
} from "taro-ui";
import "./index.scss";

interface Data {
  data: string;
}

export default class Index extends Component {
  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: "SUPER·爱農超话站"
  };

  state = {
    id: "",
    number: undefined,
    password: "",
    type: "task",
    current: 0,
    btnLoading: false,
    leaveAccount: 0,
    hasPassword: false,
    hasError: false,
    dataSource: [],
    banner: "",
    submitDisabled: false,
    modalVisible: false,
    isCopy: false,
    avatarUrl: ""
  };

  componentDidMount() {
    this.getStat();
    this.getBanner();
    // this.getUserInfo();
  }

  getUserInfo = () => {
    Taro.getUserInfo({
      success: res => {
        const {
          userInfo: { avatarUrl }
        } = res;
        this.setState({ avatarUrl });
      }
    });
  };

  getBanner = () => {
    Taro.request({
      url: "https://www.cln1003.club/getBanner",
      method: "POST",
      header: {
        "content-type": "application/json"
      }
    })
      .then(res => {
        this.setState({ banner: res.data.data });
      })
      .catch(err => {
        Taro.showToast({
          title: "网络错误，请联系管理员哦",
          icon: "none"
        });
      });
  };

  getStat = () => {
    const { type } = this.state;
    Taro.request({
      url: "https://www.cln1003.club/getStat",
      method: "POST",
      data: { type },
      header: {
        "content-type": "application/json"
      }
    })
      .then(res => {
        const { leaveAccountNumber, hasPassword } = res.data.data;
        this.setState({
          leaveAccount: leaveAccountNumber,
          hasPassword
        });
      })
      .catch(err => {
        Taro.showToast({
          title: "网络错误，请联系管理员哦",
          icon: "none"
        });
      });
  };

  fetchAccount = (id, number, password?) => {
    const { type } = this.state;
    this.setState({ goPig: true, btnLoading: true });
    Taro.request({
      url: "https://www.cln1003.club/getData",
      method: "POST",
      data: { nickName: id, amount: number, password, type },
      header: {
        "content-type": "application/json"
      }
    })
      .then(res => {
        this.setState({ btnLoading: false });
        if (res.data.code === 1) {
          Taro.showToast({ title: res.data.message, icon: "none" });
          return;
        }
        this.setState({
          dataSource: res.data.data || [],
          modalVisible: true,
          submitDisabled: true
        });
      })
      .catch(err => {
        this.setState({ btnLoading: false });
        Taro.showToast({ title: "网络错误，请联系管理员哦", icon: "none" });
      });
  };

  componentDidShow() {}

  componentDidHide() {}

  handleTabsChange = value => {
    const arr = ["task", "fight"];
    this.setState({ type: arr[value], current: value }, () => {
      this.getStat();
    });
  };

  handleNumberChange = value => {
    const { leaveAccount } = this.state;

    if (Number(value) <= (leaveAccount <= 50 ? leaveAccount : 50)) {
      this.setState({ hasError: false });
    } else {
      this.setState({ hasError: true });
      Taro.showToast({
        title:
          leaveAccount <= 50 ? `最多只能领${leaveAccount}个` : `最多只能领50个`,
        icon: "none"
      });
    }

    this.setState({
      number: value ? Number(value) : undefined
    });
  };

  onSubmit = () => {
    const { id, number, leaveAccount, password, hasPassword } = this.state;

    if (Number(number) > leaveAccount) {
      Taro.showToast({
        title: "超过当前剩余量了哦",
        icon: "none"
      });
      this.setState({ hasError: true });
      return;
    }

    if (hasPassword) {
      id && !!number && password
        ? this.fetchAccount(id, number, password)
        : Taro.showToast({ title: "信息填完哦", icon: "none" });
    } else {
      id && !!number
        ? this.fetchAccount(id, number)
        : Taro.showToast({ title: "信息填完哦", icon: "none" });
    }
  };

  // 复制到剪切板
  copy2clipboard = () => {
    const { dataSource } = this.state;
    Taro.setClipboardData({
      data: dataSource.map((v: Data) => v.data.replace(/^,/gi, "")).join("\n")
    }).then(res => {
      this.setState({ isCopy: true });
      setTimeout(() => {
        this.setState({
          modalVisible: false
        });
      }, 3000);
    });
  };

  render() {
    const {
      btnLoading,
      id,
      number,
      password,
      hasPassword,
      hasError,
      leaveAccount,
      banner,
      submitDisabled,
      modalVisible,
      dataSource,
      isCopy,
      avatarUrl
    } = this.state;

    const renderForm = () => (
      <View>
        <AtInput
          name="id"
          title="id"
          type="text"
          placeholder="输入你的微博ID"
          value={id}
          onChange={value => this.setState({ id: value })}
        />
        <AtInput
          name="number"
          title="数量"
          type="digit"
          placeholder={
            leaveAccount <= 50
              ? `输入领取数量，库存${leaveAccount}个`
              : "输入领取数量，最多领50个哦"
          }
          value={number}
          error={hasError}
          onChange={this.handleNumberChange}
        />
        {hasPassword && (
          <AtInput
            name="password"
            title="口令"
            type="digit"
            placeholder="输入口令"
            value={password}
            onChange={value => this.setState({ password: value })}
          />
        )}
      </View>
    );

    return (
      <View className="index">
        <View style="position:fixed;z-index:999;padding:10px">
          <AtAvatar image={avatarUrl} circle size="small"></AtAvatar>
        </View>

        <Swiper circular indicatorDots={false} autoplay style="height:200px">
          <SwiperItem>
            <View className="demo-text-1">
              <Image
                src={"https://www.cln1003.club/" + banner}
                mode="aspectFill"
                style="width: 100%"
              />
            </View>
          </SwiperItem>
        </Swiper>

        <AtTabs
          current={this.state.current}
          tabList={[{ title: "微博号" }, { title: "备用号" }]}
          onClick={this.handleTabsChange}
        >
          <AtTabsPane current={this.state.current} index={0}>
            {renderForm()}
          </AtTabsPane>
          <AtTabsPane current={this.state.current} index={1}>
            {renderForm()}
          </AtTabsPane>
        </AtTabs>

        <View className="logo">
          <Text style="font-family:arial">&reg;</Text>
          <Text>SUPER·爱農超话站</Text>
        </View>

        <AtButton
          className="submit-btn"
          type="primary"
          formType="submit"
          full
          loading={btnLoading}
          onClick={this.onSubmit}
          disabled={submitDisabled}
        >
          {submitDisabled ? "领取成功，糖糖辛苦了：）" : "领取"}
        </AtButton>

        <AtModal
          isOpened={modalVisible}
          closeOnClickOverlay={false}
          onClose={() => this.setState({ modalVisible: false })}
        >
          <AtModalHeader>账号</AtModalHeader>
          <AtModalContent>
            <View style="height:100px;overflow:scroll">
              {dataSource.map((v: Data, index) => (
                <View key={index} style="text-align:center">
                  {v.data.replace(/^,/gi, "")}
                </View>
              ))}
            </View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={this.copy2clipboard}>
              {isCopy ? "去粘贴到记事本吧：)" : "点击复制"}
            </Button>
          </AtModalAction>
        </AtModal>
      </View>
    );
  }
}
