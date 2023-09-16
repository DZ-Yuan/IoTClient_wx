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
        MAX_PIN: _G.MAX_PIN,
        //Pin button status
        left_pin_stat: Array(_G.MAX_PIN / 2).fill({
            valid: false,
            lv: 0
        }),

        right_pin_stat: Array(_G.MAX_PIN / 2).fill({
            valid: false,
            lv: 0
        }),
    },

    // TODO: 只发送修改的Pin还是全部都发？
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

    updatePinBtn(pin, side, lv) {
        var left_pin_arr = this.data.left_pin_stat;
        var right_pin_arr = this.data.right_pin_stat;
        console.log("Check pin change: side ", side, " pin ", pin, " lv ", lv)
        if (side == "L") {
            left_pin_arr[pin].stat = lv ? "primary" : "default";
            left_pin_arr[pin].lv = lv;
            this.setData({
                left_pin_stat: left_pin_arr,
            });
        } else {
            right_pin_arr[pin].stat = lv ? "primary" : "default";
            right_pin_arr[pin].lv = lv;
            this.setData({
                right_pin_stat: right_pin_arr
            });
        }
    },

    initPinStat() {
        var valid_set = this.data.dev_info.pin_valid;
        var set = this.data.dev_info.pin_set;

        console.log("Check pin mask: ", valid_set);
        console.log("Check pin val: ", set);

        var pin_arr = this.data.left_pin_stat;
        // left pin
        for (var i = 0; i < _G.MAX_PIN / 2; ++i) {
            var val = _G.getBitVal(valid_set, i)
            console.log("Check pin mask bit ", i, " : ", val);
            console.log("Check pin val bit ", i, " : ", _G.getBitVal(set, i));
            if (val)
                pin_arr[i] = {
                    valid: true,
                    stat: _G.getBitVal(set, i),
                };
        }

        //right pin
        var offset = _G.MAX_PIN / 2;
        pin_arr = this.data.right_pin_stat;
        for (var i = offset; i < _G.MAX_PIN; ++i) {
            var val = _G.getBitVal(valid_set, i)
            console.log("Check pin mask bit ", i, " : ", val);
            console.log("Check pin val bit ", i, " : ", _G.getBitVal(set, i));
            if (val)
                pin_arr[i - offset] = {
                    valid: true,
                    stat: _G.getBitVal(set, i),
                };
        }

        this.setData({
            left_pin_stat: this.data.left_pin_stat,
            right_pin_stat: this.data.right_pin_stat,
        });
    },

    onTapPinBtn(e) {
        var pin = e.currentTarget.dataset.pin;
        var is_right_pin = e.currentTarget.dataset.side == "R" ? true : false

        // is left side
        var pin_arr = this.data.left_pin_stat;
        var real_pin = pin

        if (is_right_pin) {
            // is right side
            real_pin += this.data.MAX_PIN / 2;
            pin_arr = this.data.right_pin_stat;
        }

        console.log("is_right_pin: " + is_right_pin);
        console.log("Tap pin: " + real_pin);

        var set = this.data.dev_info.pin_set;
        var lv = !pin_arr[pin].lv;

        // update pin set
        this.data.dev_info.pin_set = _G.setBitVal(set, real_pin, lv);
        // update pin arr
        this.updatePinBtn(pin, is_right_pin ? "R" : "L", lv);
        //send control msg
        this.sendControlMsg(real_pin, lv);
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
            this.initPinStat();
            this.setData({
                left_pin_stat: this.data.left_pin_stat,
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