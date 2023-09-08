// pages/cloudIndex/cloudIndex.js
// ES6
import * as _G from "../../common/common.js";

Page({

    tcp_sock: null,

    /**
     * 页面的初始数据
     */
    data: {
        cloud_ip: "0.0.0.0",
        cloud_port: -1,
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
        dev_list: []
    },

    getDevByIP(ip) {
        for (var v of this.data.dev_list) {
            if (v.ip_addr == ip)
                return v;
        }
    },

    getDevById(dev_id) {
        var list = this.data.dev_list;
        for (var v of list) {
            if (v.id == dev_id)
                return v;
        }
    },

    parseComfire(dv) {
        // msg
        var err_code = dv.getUint8(1);

        if (err_code) {
            return;
        }

        var reply_cmd = dv.getUint8(2);

        switch (reply_cmd) {
            case _G.PROTO_CMD.REQ_DEVLIST:
                var count = dv.getUint8(3);
                console.log("dev count is: " + count);
                // TODO: 判断count的合法性
                // 从第4个字节起是devlist
                var offset = 4;
                for (var i = 0; i < count; ++i) {
                    // nid
                    var nid = dv.getUint8(offset);
                    offset += 1;

                    var is_exist = false;
                    var dev_info = this.getDevById(nid) || _G.allocDevData();

                    if (dev_info.id != 0)
                        is_exist = true;

                    dev_info.id = nid;
                    // name
                    var name_byte = new Uint8Array(dv.buffer, offset, offset + 3);
                    offset += 4;
                    console.log(name_byte);
                    dev_info.name = _G.uint8ArrayToString(name_byte);
                    // islive
                    dev_info.is_online = dv.getUint8(offset);
                    offset += 1;


                    if (!is_exist)
                        this.data.dev_list.push(dev_info);
                }

                this.setData({
                    dev_list: this.data.dev_list
                });

                break;
        }

    },

    parseMsg(obj) {
        // remoteInfo
        var remote_info = obj.remoteInfo;
        // msg
        var dv = new DataView(obj.message);
        var cmd = dv.getUint8(0);
        console.log("Parse cmd is: " + cmd);
        // CMD
        switch (cmd) {
            case _G.PROTO_CMD.COMFIRM:
                this.parseComfire(dv);
                break;
        }
    },

    pullDevInfoList() {
        if (!this.tcp_sock)
            return;

        // send cmd
        var msg = new ArrayBuffer(_G.MAX_MSG_SIZE);
        // head len
        new Uint16Array(msg)[0] = _G.MAX_MSG_SIZE;
        var msg_u8 = new Uint8Array(msg);
        // system id
        msg_u8[2] = 1;
        // cmd
        msg_u8[3] = _G.PROTO_CMD.REQ_DEVLIST;

        this.tcp_sock.write(msg);
    },

    connect2CloudViaWebSock() {
        wx.connectSocket({
            url: '',
        })
    },

    connect2Cloud() {
        this.tcp_sock = wx.createTCPSocket();
        var that = this;

        this.tcp_sock.onConnect(
            function (e) {
                console.log("Connect successfully!");
                console.log(e);
                setTimeout(that.pullDevInfoList, 2000);
            }
        );

        this.tcp_sock.onMessage((res) => {
            console.log("Recv reply");
            console.log(res);
            this.parseMsg(res);
        });

        this.tcp_sock.onClose(() => {
            console.log("CloseSocket");
        });

        this.tcp_sock.onError((e) => {
            console.log("Sock Err ");
            console.log(e);
        });

        this.tcp_sock.connect({
            // address: _G.CLOUD_IP_ADDR,
            // port: _G.CLOUD_TCP_PORT,
            // via proxy
            address: _G.CLOUD_DOMAIN_NAME_2,
            port: _G.CLOUD_TCP_PORT,
        });

    },

    closeSock() {
        if (this.tcp_sock && this.tcp_sock.close) {
            this.tcp_sock.close();
            this.tcp_sock = null;
        }
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
                    sock: this.tcp_sock,
                    from: "cloud"
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
        // this.closeSock();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        this.closeSock();
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