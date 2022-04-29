// console.show()
console.info("注意：提前将商品加入购物车")

//===============================================================================
//===================================基础配置=================================
//===============================================================================
const listData = [
    {words: "结算",matchType: 1,delay: 1000},
    {words: "我知道了",matchType: 0,delay: 0},
    {words: "返回购物车",matchType: 0,delay: 0},
    {words: "极速支付",matchType: 0,delay: 0},
    {words: "立即支付",matchType: 0,delay: 0},
    {words: "确认并支付",matchType: 0,delay: 0},
    {words: "重新加载",matchType: 0,delay: 500},
    {words: "免密支付",matchType: 0,delay: 1000}
];
//===============================================================================
//===================================悬浮窗配置=================================
//===============================================================================
var uiMode = ui.isUiThread(); // 是否ui模式
var timingIndex = 0; // 对应timingModes
var times = [
    {v:false,name:"模式:立即"},
    {v:[5, 59, 50],name:"模式:定时5:59:50"},
    {v:[8, 29,50],name:"模式:定时8:29:50"}
];
var timingIntarval; // 定时模式的定时器
var floatyRunning = false; // 悬浮窗是否打开的

// 打开悬浮窗
showFloaty()

// 主程序
function run () {
    console.info("打开美团买菜")
    app.launchPackage("com.meituan.retail.v.android")

    var stipBtnThread = threads.start(function () {
        clickTextOnce("跳过", 0)
    })
    var qrBtnThread = threads.start(function () {
        clickTextOnce("确认选择", 0)
    })

    console.info("点击购物车")
    id("img_shopping_cart").findOne().parent().click();
    stipBtnThread.interrupt();
    qrBtnThread.interrupt();
    
    console.info("全选购物车")
    selectAllcart();
    
    console.info("开启监测线程")
    listenThreads();
    console.info("开始抢购")
    startClickThreads(listData);

}

//===============================================================================
//===================================提醒方式=================================
//===============================================================================
// 成功震动 10秒
function successShock() {
    threads.start(()=>{
        for (i = 0; i < 5; i++) {
            device.vibrate(300)
            sleep(500)
            device.vibrate(1000)
            sleep(1500)
        }
    })
}
// 警报震动 19秒
function alertShock() {
    threads.start(()=>{
        for (i = 0; i < 10; i++) {
            device.vibrate(300)
            sleep(300)
            device.vibrate(800)
            sleep(800)
            device.vibrate(400)
            sleep(800)
        }
    });
}
// 响铃+弹窗提醒
function notify(tips, volume) {
    threads.start(()=>{
        var volume = volume || 50
        // 来电铃声 TYPE_RINGTONE 提示音 TYPE_NOTIFICATION 闹钟铃声 TYPE_ALARM
        var uri = android.media.RingtoneManager.TYPE_ALARM
        var mp = new android.media.MediaPlayer();
        device.setMusicVolume(volume)
        mp.setDataSource(context, android.media.RingtoneManager.getDefaultUri(uri));
        mp.prepare();
        mp.start();
            dialogs.build({
                title: tips,
                positive: "确定"
            }).on("cancel", ()=>{
                mp.stop();
            }).on("positive", ()=>{
                mp.stop();
            }).show();;
    })
}
//===============================================================================
//===================================美团功能=================================
//===============================================================================
// 全选购物车
function selectAllcart() {
    var j1 = getCartNum();
    if (j1 == 0) {
        text("全选").findOne().parent().click();
    } else {
        text("全选").findOne().parent().click();
        let i = 0;
        while(true){
            var j2 = getCartNum();
            if (j1 != j2) {
                if(j2 == 0){
                    clickTextOnce("全选", 0);
                }
                break;
            }
            if(i++==100){
                toast("全选购物车失败")
                break;
            }
            sleep(500)
        }
    }
}
// 获取购物车数量
function getCartNum() {
    var temp = textStartsWith("结算").findOne().text().match(/\d+/);
    return temp ? temp[0] : 0;
}
// 监测线程
function listenThreads() {
    // 监测抢购成功
    threads.start(function () {
        className("android.widget.TextView").text("支付成功").findOne();
        console.info("恭喜您，抢购成功");
        notify("抢购成功啦！！！");
        console.info("结束");
        threads.shutDownAll();
    })
}
//===============================================================================
//===================================悬浮窗=================================
//===============================================================================
// 创建悬浮窗（ui模式下需要在线程里创建悬浮窗）
function showFloaty(){
    if(uiMode){
        console.info("ui模式")
        threads.start(()=>{
            sf();
        })
    } else {
        console.info("非ui模式")
        sf();
    }
}
function sf(){
    floatyRunning = true;
    var excuting = false;
    var window = floaty.window(
        <vertical id="boxFloaty" bg="#33333333" padding="3">
            <linear>
                <button id="moveFloaty" bg="#909399" color="white" text="窗口位置"/>
                <button w="*" id="exitFloaty" bg="#f56c6c" color="white" text="关闭窗口"/>
            </linear>
            <linear>
                <button id="modeFloaty" bg="#409eff" color="white" text="模式"/>
                <button id="startFloaty" bg="#67c23a" color="white" text="开始"/>
            </linear>
        </vertical> 
    );
    if(!uiMode){
        setInterval(()=>{},1000)
        window.exitOnClose();
    }
    // 模式
    window.modeFloaty.setText(times[timingIndex].name);
    window.modeFloaty.on("click",()=>{
        if(!excuting) {
            let timingModesCopy = [];
            for(let i=0;i<times.length;i++){
                timingModesCopy[i] = times[i].name;
            }
            timingModesCopy.push("自定义时间");
            dialogs.build({
                title: "模式",
                items: timingModesCopy,
                itemsSelectMode: "single",
                itemsSelectedIndex: timingIndex
            }).on("single_choice", (k, v)=>{
                if(k==timingModesCopy.length-1){
                    dialogs.rawInput("时间格式（时:分:秒）")
                        .then(t => {
                            if (!t) {
                                return;
                            }
                            let m = t.match("^(2{1}[0-3]{1}|1{1}[0-9]{1}|0{0,1}\\d{1}):(5{1}[0-9]{1}|4{1}[0-9]{1}|3{1}[0-9]{1}|2{1}[0-9]{1}|1{1}[0-9]{1}|0{0,1}\\d{1}):(5{1}[0-9]{1}|4{1}[0-9]{1}|3{1}[0-9]{1}|2{1}[0-9]{1}|1{1}[0-9]{1}|0{0,1}\\d{1})$");
                            if (m) {
                                let name = "模式:定时"+m[1]+":"+m[2]+":"+m[3]
                                times.push({v:[m[1],m[2],m[3]],name:name})
                                timingIndex = times.length-1;
                                window.modeFloaty.setText(name);
                                if(timingIntarval) clearInterval(timingIntarval);
                            } else {
                                alert("格式有误");
                            }
                        });
                } else {
                    timingIndex = k;
                    window.modeFloaty.setText(v);
                    if(timingIntarval) clearInterval(timingIntarval);
                }
            }).show()
        }
    });
    // 开始执行/暂停
    window.startFloaty.on("click", () => {
        if(!excuting){
            excuting = true;
            toast("正在启动")
            window.startFloaty.setText("暂停")
            window.boxFloaty.setAlpha(0.6)
            timingStart(timingIndex, run)
        } else if(excuting){
            excuting=false;
            window.startFloaty.setText("开始")
            window.modeFloaty.setText(times[timingIndex].name);
            window.boxFloaty.setAlpha(1)
            if(timingIntarval) clearInterval(timingIntarval);
            threads.shutDownAll()
        }
    });
    // 关闭悬浮窗
    window.exitFloaty.on("click", () => {
        toast("已退出悬浮窗")
        // 关闭悬浮窗
        floaty.closeAll()
        // 关闭定时器
        if(timingIntarval) clearInterval(timingIntarval);
        // ui模式打开
        // ui.launch.setText("开始")
        floatyRunning = false;
        // 关闭所有线程
        threads.shutDownAll()
    });
    // 移动悬浮窗
    window.moveFloaty.on("click", () => {
        window.setAdjustEnabled(!window.isAdjustEnabled());
    });
    // 延迟阻塞
    function timingStart(tI, func) {
        var time = times[tI].v;
        if (time && time.length==3) {
            console.info("准备定时执行，目标时间: " + time[0] + "时" + time[1] + "分" + time[2] + "秒")
            timingIntarval = setInterval(()=>{
                let date = new Date();
                if (date.getHours() == time[0] && date.getMinutes() == time[1] && date.getSeconds() == time[2]) {
                    threads.start(()=>{
                        func();
                    })
                    clearInterval(timingIntarval);
                }
                window.modeFloaty.setText(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
            }, 1000)
        } else {
            console.info("立即执行")
            threads.start(()=>{
                func();
            })
        }
    }
}
//===============================================================================
//===================================文字点击部分=================================
//===============================================================================
// 批量开启文字点击线程
function startClickThreads(list) {
    for (let i = 0; i < list.length; i++) {
        (function abc(j) {
            threads.start(function () {
                clickTextLoop(list[j].words, list[j].delay, list[j].matchType)
            })
        })(i)
    }
}

// 基础点击方法 t-文字 d-间隔 m-匹配类型
function clickTextLoop(t, d, m) {
    console.info("初始化线程:" + t + " " + d + " " + m)
    for(let j = 1;;j++){
        findParentClick(matchText(t, m).findOne(), 1);
        console.info("第" + j + "次'" + t + "'")
        if (d != 0) {
            sleep(d)
        }
    }
}

// 基础点击方法 t-文字 m-匹配类型
function clickTextOnce(t, m){
    findParentClick(matchText(t, m).findOne(), 1);
    console.info("点击'" + t + "'")
}

// 匹配文字
function matchText(t, m){
    let tv = className("android.widget.TextView");
    let temp = m == 0 ? tv.text(t) :
        m == 1 ? tv.textStartsWith(t) :
        m == 2 ? tv.textEnds(t) :
        tv.textContains(t);
    return temp;
}

// 向上点击
function findParentClick(p, deep) {
    if (p.clickable()) {
        p.click();
    } else {
        if ((deep++) > 6) {
            toast("click err")
            return;
        }
        findParentClick(p.parent())
    }
}
