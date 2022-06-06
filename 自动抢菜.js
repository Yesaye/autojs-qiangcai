//console.show()
console.info("注意：提前将商品加入购物车")

//===============================================================================
//===================================基础配置=================================
var  PRESET_DATA = [
    {
        presetName:"美团买菜",appPackage:"com.meituan.retail.v.android",
        clickList:
            [
                {words: "结算",matchType: 1,delay: 1000},
                {words: "我知道了",matchType: 0,delay: 0},
                {words: "极速支付",matchType: 0,delay: 0},
                {words: "立即支付",matchType: 0,delay: 0},
                {words: "确认并支付",matchType: 0,delay: 1000},
                {words: "免密支付",matchType: 0,delay: 1000},
            ]
            // {words: "返回购物车",matchType: 0,delay: 0},
            // {words: "重新加载",matchType: 0,delay: 500},
            // {words: "img_shopping_cart",matchType: 4,delay: 5000} // 坐标点击时会偶尔点到其他页面
    },
    {
        presetName:"叮咚买菜",appPackage:"com.yaya.zone",
        clickList:
            [
                {words:"去结算",matchType:1,delay:0},
                {words:"立即支付",matchType:0,delay:0},
                {words:"重新加载",matchType:0,delay:300}
            ]
            // {words:"返回购物车",matchType:0,delay:0},
    }
];
var fastMode = true; // true:极速点击 false:模拟坐标点击

//===============================================================================
//===================================悬浮窗配置=================================
var PRESET_NAME_LIST = [];
var PRESET_PACKAGE_LIST = [];
var presetIndex = 0;
for(let i=0;i<PRESET_DATA.length;i++){
    PRESET_NAME_LIST.push(PRESET_DATA[i].presetName)
    PRESET_PACKAGE_LIST.push(PRESET_DATA[i].appPackage)
}
var uiMode = ui.isUiThread(); // 是否ui模式
var exeModeIndex = 0; // 对应timingModes
var exeMode = [
    {k:false,v:"模式:立即抢购"},
    {k:[5, 59, 50],v:"模式:定时5:59:50"},
    {k:[8, 29,50],v:"模式:定时8:29:50"}
];
var timingIntarval; // 定时模式的定时器
var countdownIntarval; // 倒计时的定时器
var floatyRunning = false; // 悬浮窗是否打开的
var window; //悬浮窗实例
var defaultTip = "选好模式和软件，然后开始";
var timingTip = "请保持在购物车界面";
var runningTip = "正在运行";

// 打开悬浮窗
showFloaty()

// 主程序
function run () {
    console.info("正在打开"+PRESET_NAME_LIST[presetIndex])
    app.launchPackage(PRESET_PACKAGE_LIST[presetIndex])

    // 开启前置动作
    if(exeMode[exeModeIndex].k){
        switch (presetIndex){
            case 0: meituanFastGo(); break;
            case 1: dingdongFatGo(); break;
            default:;
        }
    }
    // 开启监测线程
    switch (presetIndex){
        case 0: meituanListen(); break;
        case 1: dingdongListen(); break;
        default:;
    }

    // 开启动作
    timingStart()
}

//===============================================================================
//===================================美团功能=================================
// 快速前置
function meituanFastGo(){
    console.info("美团fastGo");
    var stipBtnThread = threads.start(function () {
        clickOnce("跳过", 0)
    })
    var qrBtnThread = threads.start(function () {
        clickOnce("确认选择", 0)
    })

    console.info("点击购物车")
    let isc = id("img_shopping_cart").findOne(6000)
    if (isc) clickOnce("img_shopping_cart", 4);
    stipBtnThread.interrupt();
    qrBtnThread.interrupt();
    
    console.info("全选购物车")
    selectAllcart();
}
// 监测线程
function meituanListen() {
    console.info("开启监测线程")
    // 监测抢购成功
    threads.start(() => {
        className("android.widget.TextView").text("支付成功").findOne();
        console.info("恭喜您，抢购成功");
        notify("抢购成功啦！！！",()=>{window.startFloaty.click()});
        console.info("结束");
    })
}
// 全选购物车
function selectAllcart() {
    var j1 = getCartNum();
    if (j1 == 0) {
        clickOnce("全选", 0)
    } else {
        clickOnce("全选", 0)
        let i = 0;
        while(true){
            var j2 = getCartNum();
            if (j1 != j2) {
                if(j2 == 0){
                    clickOnce("全选", 0);
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

//===============================================================================
//===================================叮咚功能=================================
// 快速前置
function dingdongFatGo(){
    console.info("叮咚fastGo");
    var skipBtnThread = threads.start(()=>{
        clickOnce("跳过", 1)
    })
    clickOnce("购物车", 0)
    skipBtnThread.interrupt();
}
// 监测线程
function dingdongListen(){
}

//===============================================================================
//===================================提醒方式=================================
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
function notify(tips, func) {
    threads.start(()=>{
        // 来电铃声 TYPE_RINGTONE 提示音 TYPE_NOTIFICATION 闹钟铃声 TYPE_ALARM
        var uri = android.media.RingtoneManager.TYPE_ALARM
        var mp = new android.media.MediaPlayer();
        mp.setDataSource(context, android.media.RingtoneManager.getDefaultUri(uri));
        mp.prepare();
        mp.start();
        dialogs.build({
            title: tips,
            positive: "确定"
        }).on("cancel", ()=>{
            mp.stop();
            func();
        }).on("positive", ()=>{
            mp.stop();
            func();
        }).show();
    })
}

//===============================================================================
//===================================悬浮窗=================================
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
    window = floaty.window(
        <vertical w="*" id="boxFloaty" bg="#9769aef5" padding="6">
            <linear id="btn1">
                <button id="moveFloaty" bg="#409eff" color="white" text="窗口位置"/>
                <button w="*" id="exitFloaty" bg="#65affb" color="white" text="关闭窗口"/>
            </linear>
            <linear id="btn2">
                <button id="modeFloaty" bg="#65affb" color="white" text="模式"/>
                <button id="presetFloaty" bg="#409eff" color="white" text="预设"/>
            </linear>
            <text id="tip" w="*" gravity="center" color="white" bg="#f56c6c" textSize="12sp" text=""></text>
            <linear id="btn3">
                <button w="*" id="startFloaty" bg="#67c23a" color="white" text="开始"/>
            </linear>
        </vertical> 
    );
    if(!uiMode){
        setInterval(()=>{},1000)
        window.exitOnClose();
    }
    window.tip.setText(defaultTip);
    loadPresetName();
    // 模式
    window.modeFloaty.setText(exeMode[exeModeIndex].v);
    window.modeFloaty.on("click",()=>{
        if(!excuting) {
            let timingModesCopy = [];
            for(let i=0;i<exeMode.length;i++){
                timingModesCopy[i] = exeMode[i].v;
            }
            timingModesCopy.push("自定义时间");
            dialogs.build({
                title: "模式",
                items: timingModesCopy,
                itemsSelectMode: "single",
                itemsSelectedIndex: exeModeIndex
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
                                exeMode.push({k:[m[1],m[2],m[3]],v:name})
                                exeModeIndex = exeMode.length-1;
                                window.modeFloaty.setText(name);
                                if(timingIntarval) clearInterval(timingIntarval);
                                if(countdownIntarval) {clearInterval(countdownIntarval);window.tip.setText(defaultTip)};
                            } else {
                                alert("格式有误");
                            }
                        });
                } else {
                    exeModeIndex = k;
                    window.modeFloaty.setText(v);
                    if(timingIntarval) clearInterval(timingIntarval);
                    if(countdownIntarval) {clearInterval(countdownIntarval);window.tip.setText(defaultTip)};
                }
            }).show();
        } else {
            toast("请先暂停")
        }
    });
    // 切换预设
    window.presetFloaty.on("click", () => {
        if(!excuting) {
            // 直接切换
            presetIndex = presetIndex==PRESET_NAME_LIST.length-1?0:presetIndex+1;
            loadPresetName();
            // 弹窗切换
            // dialogs.build({
            //     title: "模式",
            //     items: PRESET_NAME_LIST,
            //     itemsSelectMode: "single",
            //     itemsSelectedIndex: presetIndex
            // }).on("single_choice", (k, v)=>{
            //     presetIndex = k;
            //     loadPresetName();
            // }).show()
        } else {
            toast("请先暂停")
        }
    })
    // 开始执行/暂停
    window.startFloaty.on("click", () => {
        if(!excuting){
            excuting = true;
            toast("正在启动")
            window.startFloaty.setText("暂停")
            window.btn1.setAlpha(0.6)
            window.btn2.setAlpha(0.6)
            window.btn3.setAlpha(0.6)
            window.tip.setText(runningTip);
            if (exeMode[exeModeIndex].k && exeMode[exeModeIndex].k.length==3) {
                let now = new Date();
                let y = now.getFullYear();
                let m = now.getMonth()+1;
                let d = now.getDate();
                let lastSecond = Date.parse(y+"/"+m+"/"+d+" "+exeMode[exeModeIndex].k[0]+":"+exeMode[exeModeIndex].k[1]+":"+exeMode[exeModeIndex].k[2]) - now.getTime();
                if(lastSecond<-2000 || lastSecond>2000){
                    if(lastSecond<-2000){
                        lastSecond += 24*3600*1000;
                    }
                    window.tip.setText(timingTip)
                    countdownIntarval = setInterval(()=>{
                        if((lastSecond-=100)<=0){
                            clearInterval(countdownIntarval);
                            window.tip.setText(runningTip);
                            window.modeFloaty.setText("倒计时:结束");
                        } else{
                            window.modeFloaty.setText("倒计时:"+ lastSecond+"\t");
                        }
                    },100)
                }
            }
            threads.start(()=>{run()})
        } else {
            excuting=false;
            window.startFloaty.setText("开始")
            window.modeFloaty.setText(exeMode[exeModeIndex].v);
            window.btn1.setAlpha(1)
            window.btn2.setAlpha(1)
            window.btn3.setAlpha(1)
            if(timingIntarval) clearInterval(timingIntarval);
            if(countdownIntarval) clearInterval(countdownIntarval);
            window.tip.setText(defaultTip)
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
        if(countdownIntarval) {clearInterval(countdownIntarval);window.tip.setText(defaultTip)};
        // ui模式下
        // ui.launch.setText("开始")
        floatyRunning = false;
        // 关闭所有线程
        threads.shutDownAll()
    });
    // 移动悬浮窗
    window.moveFloaty.on("click", () => {
        window.setAdjustEnabled(!window.isAdjustEnabled());
    });
    function loadPresetName(){
        window.presetFloaty.setText(PRESET_NAME_LIST[presetIndex]);
    }
}
// 延迟阻塞
function timingStart() {
    let now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth()+1;
    let d = now.getDate();
    let lastSecond = Date.parse(y+"/"+m+"/"+d+" "+exeMode[exeModeIndex].k[0]+":"+exeMode[exeModeIndex].k[1]+":"+exeMode[exeModeIndex].k[2]) - now.getTime();
    if (exeMode[exeModeIndex].k && exeMode[exeModeIndex].k.length==3 && (lastSecond<-2000 || lastSecond>2000)) {
        console.info("准备定时执行，目标时间: " + exeMode[exeModeIndex].k[0] + "时" + exeMode[exeModeIndex].k[1] + "分" + exeMode[exeModeIndex].k[2] + "秒");
        if(lastSecond<-2000){
            lastSecond += 24*3600*1000;
        }
        timingIntarval = setInterval(()=>{
            if((lastSecond-=100)<=0){
                startClickThreads(PRESET_DATA[presetIndex].clickList)
                clearInterval(timingIntarval);
            }
        },100)
    } else {
        console.info("立即开始执行")
        startClickThreads(PRESET_DATA[presetIndex].clickList)
    }
}

//===============================================================================
//===================================文字点击部分=================================
// 批量开启文字点击线程
function startClickThreads(list) {
    for (let i = 0; i < list.length; i++) {
        (function abc(j) {
            threads.start(function () {
                clickLoop(list[j].words, list[j].delay, list[j].matchType)
            })
        })(i)
    }
}

// 基础点击方法 t-文字 d-间隔 m-匹配类型
function clickLoop(t, d, m) {
    console.info("初始化线程:" + t + " " + d + " " + m)
    for(let j = 1;;j++){
        if(fastMode){
            clickUpwardParent(match(t, m).findOne(), 1);
        } else {
            clickPosition(match(t, m));
        }
        console.info("第" + j + "次'" + t + "'")
        if (d) sleep(d); 
    }
}

// 基础点击方法 t-文字 m-匹配类型
function clickOnce(t, m){
    if(fastMode){
        clickUpwardParent(match(t, m).findOne(), 1);
    } else {
        clickPosition(match(t, m))
    }
    console.info("点击'" + t + "'")
}

// 匹配查找
function match(t, m){
    switch (m) {
        case 0: return className("android.widget.TextView").text(t);
        case 1: return className("android.widget.TextView").textStartsWith(t);
        case 2: return className("android.widget.TextView").textEnds(t);
        case 3: return className("android.widget.TextView").textContains(t);
        default: return id(t);
    }
}

// 向上点击
function clickUpwardParent(p, deep) {
    if (p.clickable()) {
        p.click();
    } else {
        if ((deep++) > 6) {
            toast("click err")
            return;
        }
        clickUpwardParent(p.parent())
    }
}

// 点击元素中心点
function clickPosition(p){
    p.findOne();
    sleep(150); // 抵消弹框动画，否则bounds位置不准
    let pb = p.findOne().bounds();
    let x = pb.centerX();
    let y = pb.centerY();
    threads.start(()=>{
        click(x, y); // 多点他妈的几次
        console.info("点击:(" + x + "," + y + ")");
    })
}