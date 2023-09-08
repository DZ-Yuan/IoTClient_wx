// pages/tPage/tPage.js
// var _G = require('../../common/common.js');
// ES6
import * as _G from "../../common/common.js";

Page({

    // timer
    bcast_send_timer: null,

    // udp socket
    sock_bcast: null,
    sock_local: null,

    /**
     * 页面的初始数据
     */
    data: {
        ssid: 'N/A',
        ip_addr: '0.0.0.0',
        broadcast_ip: '0.0.0.0',
        status: 0,
        wifi: {},

        // interface text
        search_btn_text: 'Search',
        status_text: 'offline',

        /* device data struct
          {
            id:
            name:
            is_online:
            ip_addr:
            last_update_time:
            pin_set:{}
          }
        */
        devices: [],
    },

    onButtonTap(e) {
        console.log("Tap button!");
        console.log(e);

        const sock = wx.createTCPSocket();

        sock.onConnect(
            function (e) {
                console.log("Connect successfully!");
                console.log(e);
                sock.write("Hello Server\n");
            }
        );

        sock.onClose(() => {
            console.log("CloseSocket");
        });

        sock.onError((e) => {
            console.log("Sock Err: ");
            console.log(e);
        });


        sock.connect({
            address: _G.CLOUD_IP_ADDR,
            port: 5678,
        });

        setTimeout(
            function () {
                sock.close();
            },
            3000
        );

        sock.close();
    },

    updateWifiInfo() {
        // Get wifi information
        wx.getConnectedWifi({
            success: (res) => {
                console.log("Obtain wifi info:");
                console.log(res);

                this.setData({
                    ssid: res.wifi.SSID,
                    wifi: res.wifi
                });

                // Get local ip
                wx.getLocalIPAddress({
                    success: (res) => {
                        this.setData({
                            ip_addr: res.localip
                        });
                    }
                })
            },

            fail: (res) => {
                console.log("Fail to obtain wifi info! Please make sure the current device is connected to wifi");
                this.setData({
                    ssid: 'N/A',
                    wifi: {}
                });
            }

        })
    },

    getDevByIP(ip) {
        for (var v of this.data.devices) {
            if (v.ip_addr == ip)
                return v;
        }
    },

    getDevById(dev_id) {
        var list = this.data.devices;
        for (var v of list) {
            if (v.id == dev_id)
                return v;
        }
    },

    parseData(obj) {
        // remoteInfo
        var remote_info = obj.remoteInfo;
        // msg
        var msg = new Uint8Array(obj.message);

        // CMD
        switch (msg[0]) {
            case _G.PROTO_CMD.CONNECT:
                // dev id
                var id = msg[1];
                // name
                var op = new Uint8Array(obj.message, 2, 5);
                console.log(op);

                // dev info
                var is_exist = false;
                var dev_info = this.getDevByIP(remote_info.address) || _G.allocDevData();

                if (dev_info.id != 0)
                    is_exist = true;

                dev_info.id = id
                dev_info.name = _G.uint8ArrayToString(op);
                dev_info.is_online = true;
                dev_info.ip_addr = remote_info.address;
                dev_info.last_update_time = 0;

                if (!is_exist)
                    this.data.devices.push(dev_info);

                this.setData({
                    devices: this.data.devices
                });

                // acknowledge
                var reply_data = new ArrayBuffer(_G.MAX_MSG_SIZE);
                var byte_op = new Uint8Array(reply_data);

                byte_op[0] = _G.PROTO_CMD.COMFIRM;

                this.sock_local.send({
                    address: remote_info.address,
                    port: _G.COMMUNICATION_UDP_PORT,
                    message: reply_data,
                    setBroadcast: true,
                })

                // TODO: reg Heartbeat timer
                break;

        }
    },

    closeSock() {
        if (this.sock_bcast && this.sock_bcast.close) {
            this.sock_bcast.close();
            this.sock_bcast = null;
        }

        if (this.sock_local && this.sock_local.close) {
            this.sock_local.close();
            this.sock_local = null;
        }

        // FIXME: Consider where the following operations would be better placed
        const app = getApp();
        if (app.globalData.sock_bcast)
            app.globalData.sock_bcast = null;


        if (app.globalData.sock_local)
            app.globalData.sock_local = null;

        console.log("Close Sock Done!");
    },

    cleanTimer() {
        if (this.bcast_send_timer) {
            clearInterval(this.bcast_send_timer);
            this.bcast_send_timer = null;
        }
    },

    endSearch() {
        console.log('End Search..');
        this.setData({
            search_btn_text: 'Search',
            status_text: 'offline',
        });
        this.data.status = 0;
        this.cleanTimer();
        // TODO: Send end msg
        this.closeSock();
    },

    onSearchLoaclDev() {
        this.data.status = 1;
        console.log('on Search Local Device...');
        this.setData({
            status_text: 'onSearching...',
            search_btn_text: 'EndSearch',
        });

        if (!this.sock_bcast) {
            this.sock_bcast = wx.createUDPSocket();
            this.sock_local = wx.createUDPSocket();

            const app = getApp();
            app.globalData.sock_bcast = this.sock_bcast;
            app.globalData.sock_local = this.sock_local;
        }

        console.log(this.sock_bcast);

        this.sock_bcast.bind(_G.BROADCAST_UDP_PORT);
        this.sock_local.bind(_G.COMMUNICATION_UDP_PORT);

        this.sock_bcast.onError(
            (err) => {
                console.log("sock_bcast error");
                console.log(err);
            }
        )

        this.sock_local.onError(
            (err) => {
                console.log("sock_local error");
                console.log(err);
            }
        )

        this.sock_bcast.onClose(() => {
            console.log("close broadcast sock");
        });

        this.sock_local.onClose(() => {
            console.log("close local sock");
        });

        // on listen
        this.sock_local.onMessage((e) => {
            console.log(e);
            this.parseData(e);
        });

        var bytes = new ArrayBuffer(_G.MAX_MSG_SIZE);
        var op = new Uint8Array(bytes);
        op[0] = _G.PROTO_CMD.LCC_ADVERTISEMENT;

        this.sock_bcast.send({
            address: this.broadcast_ip,
            port: _G.BROADCAST_UDP_PORT,
            message: bytes,
            setBroadcast: true,
        });

        // send broadcast msg per 20s
        this.bcast_send_timer = setInterval(
            () => {
                this.sock_bcast.send({
                    address: this.broadcast_ip,
                    port: _G.BROADCAST_UDP_PORT,
                    message: bytes,
                    setBroadcast: true,
                });

            },
            20000);

        // Note: Dont forget close()
    },

    sendDiscoverMsg(e) {
        if (this.data.status) {
            console.log('End search');
            this.endSearch();
            return;
        }
        var that = this;
        // Get local ip
        wx.getLocalIPAddress({
            success(res) {
                console.log("Get LAN IP: " + res.localip);
                that.setData({
                    ip_addr: res.localip
                });

                var broadcast_ip = res.localip.replace(/\.\d{1,3}$/, ".255")
                console.log("Broadcast ip: " + broadcast_ip);
                that.broadcast_ip = broadcast_ip;

                that.onSearchLoaclDev();
            }

        })

    },

    onTapCheck(e) {
        console.log(this.data);
    },

    // onTap item of device list
    jumpToDevDetail(e) {
        console.log("Jump to dev detail page! \n");
        console.log(e);
        var dev_id = e.currentTarget.dataset.devId;

        wx.navigateTo({
            url: '../devDetail/devDetail?id=1',
            success: (res) => {
                var dev_info = this.getDevById(dev_id);
                res.eventChannel.emit('sendDevDataEvent', {
                    dev_info: dev_info,
                    sock: this.sock_local,
                    from: "lcc"
                })
            },

            fail: (res) => {
                console.log('Jump url fail\n');
                console.log(res);
            }
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.data.devices.push(_G.allocDevData());
        this.setData({
            devices: this.data.devices,
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        this.updateWifiInfo();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // this.endSearch();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log('Quit');
        this.endSearch();
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