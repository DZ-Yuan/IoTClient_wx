// pages/devDetail/devDetail.js
var _G = require('../../common/common.js');

Page({

    sock: null,
    jump_from: null,
    /**
     * 页面的初始数据
     */
    data: {
        dev_info: {},

        //Pin button status
        pin_btn_stat: new Array(20).fill("default"),
    },

    // XXX: 只发送修改的Pin还是全部都发？
    sendControlMsg(pin, lv) {
        // acknowledge
        var dev_info = this.data.dev_info;
        var reply_data = new ArrayBuffer(_G.MAX_MSG_SIZE);

        var dev_info = this.data.dev_info;
        if (this.jump_from == "lcc") {
            var byte_op = new Uint8Array(reply_data);
            byte_op[0] = _G.PROTO_CMD.CONTROL;
            byte_op[1] = dev_info.id
            byte_op[2] = pin;
            byte_op[3] = lv;

            this.sock.send({
                address: dev_info.ip_addr,
                port: _G.COMMUNICATION_UDP_PORT,
                message: reply_data,
                setBroadcast: false,
            })
        } else {
            // head len
            new Uint16Array(reply_data)[0] = _G.MAX_MSG_SIZE;
            var byte_op = new Uint8Array(reply_data);
            byte_op[2] = 1;
            byte_op[3] = _G.PROTO_CMD.CONTROL;
            byte_op[4] = dev_info.id
            byte_op[5] = pin;
            byte_op[6] = lv;

            this.sock.write(reply_data)
        }

    },

    setPinLevel(pin, lv) {
        var set = this.data.dev_info.pin_set;
        set[pin] = lv;
        this.updatePinBtn(pin, lv);
    },

    updatePinBtn(pin, lv) {
        var pin_arr = this.data.pin_btn_stat;

        if (pin && lv) {
            if (lv)
                pin_arr[pin] = "primary";
            else
                pin_arr[pin] = "default";
        } else {
            var set = this.data.dev_info.pin_set;
            for (var i = 0; i < set.length; ++i) {
                if (set[i])
                    pin_arr[i] = "primary";
                else
                    pin_arr[i] = "default";
            }
        }

        this.setData({
            pin_btn_stat: pin_arr
        });
    },

    onTapPinBtn(e) {
        var pin = e.currentTarget.dataset.pin;
        console.log("Tap pin: " + pin);

        var set = this.data.dev_info.pin_set;
        var lv = !(set[pin] || 0);
        this.setPinLevel(pin, lv);

        //send control msg
        this.sendControlMsg(pin, lv);
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log(options.query);
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('sendDevDataEvent', (res) => {
            console.log('recv previous page data:', res);
            this.sock = res.sock;
            this.jump_from = res.from;
            this.setData({
                dev_info: res.dev_info,
            });
            this.updatePinBtn();
            this.setData({
                pin_btn_stat: this.data.pin_btn_stat,
            });
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})