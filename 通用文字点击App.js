"ui";
ui.layout(
    <frame>
        <vertical>
            <appbar>
                <toolbar id="toolbar" title="抢菜啦"/>
            </appbar>
            <vertical margin="10sp 10sp" w="*">
                <linear margin="10 0">
                    <text text="提醒1：按[音量+]键可" color="#9f9f9f" textSize="12sp" ></text>
                    <text text="强制关闭程序！" color="#ff6666" textSize="12sp" ></text>
                </linear>
                <text text="提醒2：记得打开悬浮窗和无障碍功能哦~" color="#ff6666" textSize="12sp" margin="10 0"></text>
                <button h="42" id="launch" text="开始" bg="#009788" color="#ffffff" margin="10 5"></button>
                <linear gravity="center" w="*">
                    <button w="auto" h="42" id="deletePreset" text="删除" bg="#eeeeee" color="#ff6666" margin="10 5 5 10"></button>
                    <button w="*" h="42" id="preset" text="预设" bg="#eeeeee" color="#009788" margin="5 5 10 10"></button>
                </linear>
            </vertical>
            <list id="list">
                <card w="*" margin="10 5" cardCornerRadius="2dp"
                    cardElevation="1dp" foreground="?selectableItemBackground">
                    <horizontal gravity="center_vertical" w="*">
                        <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                            <linear>
                                <text textStyle="bold" textSize="16sp" textColor="#5555ff" text="文字 :  "/>
                                <text textStyle="italic" textSize="16sp" textColor="#000000" text="{{words}}"/>
                            </linear>
                            <linear>
                                <text textStyle="bold" textSize="16sp" textColor="#5555ff" text="方式 :  "/>
                                <text textStyle="italic" textSize="16sp" textColor="#000000" text="{{matchText}}"></text>
                            </linear>
                            <linear>
                                <text textStyle="bold" textSize="16sp" textColor="#5555ff" text="间隔 :  "/>
                                <text textStyle="italic" textSize="16sp" textColor="#000000" text="{{delay}} ms"/>
                            </linear>
                        </vertical>
                        <button id="remove" text="删除" color="#ffffff" marginLeft="4" marginRight="10"/>
                    </horizontal>
                </card>
            </list>
        </vertical>
        <fab id="add" w="auto" h="auto" src="@drawable/ic_add_black_48dp" margin="16" layout_gravity="bottom|right" tint="#ffffff" />
    </frame>
);

//===============================================================================
//===================================初始化=================================
// storages.remove("tywzdj")
var version = "1.3.3";
var floatyRunning = false;
var PRESET_DATA = []; // 当前加载的的allData
var clickList = []; // 当前预设的clickList
var fastMode = false; // true:极速点击 false:模拟坐标点击
//===============================================================================
//===================================悬浮窗配置=================================
var PRESET_NAME_LIST = [];
var PRESET_PACKAGE_LIST = [];
var presetIndex = 0;
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

//===============================================================================
var storage = storages.create("yesaye-tywzdj");
checkUpdateShowInfo();
firstInit();
loadData();

// 主程序
function run(){
    launchApp();
    timingStart();
}

//===============================================================================
//===================================按钮=================================
// 隐私协议
function checkUpdateShowInfo(){
    if(storage.contains("updateInfo") && storage.get("updateInfo")==version){
        return;
    } else {
        // 展示隐私信息
        dialogs.build({
            title: "隐私协议",
            content: "通用文字点击器是一款建议功能的文字点击器，可以帮您在必要的时候实现多处循环点击的操作。为了让用户能更加放心的使用，我们应用不会接入互联网，用户记录的所有数据均会存储于用户自己的设备中。\n\n隐私政策属于本应用中不可或缺的一部分，请先点击阅读浏览隐私协议",
            positive: "阅读",
            neutral: "取消",
            canceledOnTouchOutside:false
        }).on("positive", ()=>{
            app.openUrl("https://yesaye.cn/mcl-private.html");
            storage.put("updateInfo",version);
        }).on("neutral", ()=>{
            exit();
        }).show();
    }
}

// 第一次打开初始化预设
function  firstInit(){
    if(!storage.contains("PRESET_DATA") || storage.get("PRESET_DATA").length==0){
        PRESET_DATA = [
            {
                presetName:"美团买菜",appPackage:"com.meituan.retail.v.android",
                clickList:
                    [
                        {words: "结算",matchType: 1,delay: 1000},
                        {words: "我知道了",matchType: 0,delay: 0},
                        {words: "返回购物车",matchType: 0,delay: 0},
                        {words: "极速支付",matchType: 0,delay: 300},
                        {words: "立即支付",matchType: 0,delay: 300},
                        {words: "确认并支付",matchType: 0,delay: 0},
                        {words: "重新加载",matchType: 0,delay: 500},
                        {words: "免密支付",matchType: 0,delay: 1000}
                    ]
            },
            {
                presetName:"叮咚买菜",appPackage:"com.yaya.zone",
                clickList:
                    [
                        {words:"去结算",matchType:1,delay:0},
                        {words:"返回购物车",matchType:0,delay:0},
                        {words:"立即支付",matchType:0,delay:100},
                        {words:"重新加载",matchType:0,delay:100}
                    ]
            }
        ];
        save(null, PRESET_DATA)
    }
}

// 重新加载数据
function loadData(){
    PRESET_DATA = storage.get("PRESET_DATA", false);
    PRESET_NAME_LIST = [];
    clickList = [];
    if(PRESET_DATA){
        if(PRESET_DATA.length>0){
            // 加载预设和包名名单
            PRESET_DATA.forEach(x=>{
                PRESET_NAME_LIST.push(x.presetName)
                PRESET_PACKAGE_LIST.push(x.appPackage)
            });
            // 加载当前预设内容
            choicePreset(PRESET_NAME_LIST[presetIndex])
        }
    } else {
        save(null, [])
    }
}

// 选择预设 pName-预设名
function choicePreset(pName){
    PRESET_DATA = storage.get("PRESET_DATA");
    for(var i=0;i<PRESET_DATA.length;i++){
        if(PRESET_DATA[i].presetName==pName){
            presetIndex = PRESET_NAME_LIST.indexOf(pName);
            clickList = PRESET_DATA[i].clickList
            ui.list.setDataSource(clickList);
            ui.preset.setText("预设 ["+pName+"]");
            return true;
        }
    }
    // 删完了的情况
    clickList = [];
    ui.list.setDataSource(clickList);
    ui.preset.setText("预设 [无]");
    return false;
}

// 保存数据 tips-提示 data-数据
function save(tips, data){
    if(tips){
        toast(tips)
    }
    for(let i=0;i<data.length;i++){
        let p = data[i].clickList;
        for(let j=0;j<p.length;j++){
            p[j].matchText= (p[j].matchType==0?"精确":p[j].matchType==1?"左模糊":p[j].matchType==2?"右模糊":"全模糊")+"匹配";
        }
    }
    storage.put("PRESET_DATA", data)
    loadData()
}

// 获取软件包名
function getAppPackage(){
    PRESET_DATA = storage.get("PRESET_DATA");
    for(var i=0;i<PRESET_DATA.length;i++) {
        if(PRESET_DATA[i].presetName==PRESET_NAME_LIST[presetIndex]){
            return PRESET_DATA[i].appPackage;
        }
    }
}

function launchApp(){
    var appPackage = getAppPackage();
    var appName = app.getAppName(appPackage);
    if(appPackage && appName){
        toast("正在打开["+appName+"]")
        app.launchPackage(appPackage)
    } else {
        toast("无法打开App，或App不存在")
    }
}

//===============================================================================
//===================================ui控件触发=================================
function launchBtn(){
    // 检查悬浮窗权限
    if (!floaty.checkPermission()) {
        confirm("需要[悬浮窗权限]，请在随后的界面中允许并重新运行").then(ok => {
            if(ok){
                floaty.requestPermission();
            } else {
                toast("已取消")
            }
        })
        return;
    }
    // 检查无障碍功能
    if (auto.service==null) {
        confirm("需要[开启无障碍功能]，请在随后的界面中允许并重新运行").then(ok => {
            if(ok){
                auto()
            } else {
                toast("已取消")
            }
        })
        return;
    }
    // 开始运行
    if(!floatyRunning){
        if(clickList && clickList.length>0){
            launchApp();
            // 打开悬浮窗
            showFloaty()
            ui.launch.setText("请在悬浮窗操作")
        } else {
            ui.launch.setText("点什么点，请先添加内容！")
            setTimeout(()=>{ui.launch.setText("启动")},3000)
        }
    }
}
function presetBtn(){
    
    PRESET_DATA = storage.get("PRESET_DATA");
    var menu = PRESET_NAME_LIST.slice()
    menu.unshift("[↑]导入预设")
    menu.unshift("[↓]导出预设")
    menu.unshift("[+]新建预设")
    dialogs.select("请选择预设", menu)
    .then(i => {
        if(i==-1) return;
        // 添加预设
        if(i==0){
            dialogs.rawInput("请输入预设名称")
            .then(pn => {
                if (!pn) {
                    return;
                }
                for(var i=0;i<PRESET_DATA.length;i++){
                    if(PRESET_DATA[i].presetName==pn){
                        toast("该预设已存在")
                        return;
                    }
                }
                dialogs.rawInput("请确认对应软件的[包名]", app.getPackageName(pn))
                .then(appPackage => {
                    if(!appPackage){
                        return;
                    }
                    PRESET_DATA.push({"presetName":pn,"appPackage":appPackage,"clickList":[]})
                    save(null, PRESET_DATA)
                    choicePreset(pn)
                })
            });
        } else if(i==1) {
            // 导出预设
            for(var i=0;i<PRESET_DATA.length;i++){
                if(PRESET_DATA[i].presetName==PRESET_NAME_LIST[presetIndex]){
                    setClip(JSON.stringify(PRESET_DATA[i]))
                    toast("已复制到剪切板")
                    break;
                }
            }
        } else if(i==2) {
            // 导入预设
            dialogs.rawInput("请输入预设JSON", getClip())
            .then(jsonString => {
                if(!jsonString){
                    return;
                }
                var jsonData = JSON.parse(jsonString);
                var sameName = false;
                for(var i=0;i<PRESET_DATA.length;i++){
                    if(PRESET_DATA[i].presetName==jsonData.presetName){
                        sameName = true;
                        break;
                    }
                }
                if(sameName){
                    dialogs.rawInput("预设名重复，请修改", jsonData.presetName)
                    .then(pn => {
                        if(!pn){
                            return;
                        }
                        sameName = false
                        for(var i=0;i<PRESET_DATA.length;i++){
                            if(PRESET_DATA[i].presetName==pn){
                                sameName = true;
                                break;
                            }
                        }
                        if(sameName){
                            toast("预设名依然重复")
                        } else {
                            jsonData.presetName = pn;
                            PRESET_DATA.push(jsonData)
                            save(null, PRESET_DATA)
                            choicePreset(pn)
                        }
                    });
                } else {
                    PRESET_DATA.push(jsonData)
                    save(null, PRESET_DATA)
                    choicePreset(jsonData.presetName)
                }
            });
        } else {
            // 选择预设
            choicePreset(PRESET_NAME_LIST[i-3])
        }
    });
}
function deletePresetBtn(){
    if(!PRESET_NAME_LIST[presetIndex]){
        toast("已经没有啦~")
        return;
    }
    confirm("确定删除预设[" + PRESET_NAME_LIST[presetIndex] + "]吗？")
    .then(ok => {
        if (ok) {
            PRESET_DATA = storage.get("PRESET_DATA");
            var err = true;
            for(var i=0;i<PRESET_DATA.length;i++){
                if(PRESET_DATA[i].presetName==PRESET_NAME_LIST[presetIndex]){
                    PRESET_DATA.splice(i, 1);
                    err = false
                    break;
                }
            }
            if(err){
                toast("删除未成功")
                return;
            }
            save(null, PRESET_DATA);
            choicePreset(PRESET_NAME_LIST[presetIndex=0]);
            toast("删除成功")
        }
    });
}
function addBtn(){
    dialogs.rawInput("请输入要点击的文字")
    .then(words => {
        if (!words) {
            return;
        }
        dialogs.build({
            title: "查找类型",
            items: ["精确["+words+"]", "左模糊["+words+"]", "右模糊["+words+"]", "全模糊["+words+"]"],
            itemsSelectMode: "single",
            itemsSelectedIndex: 0
        }).on("single_choice", (matchType, matchText)=>{
                dialogs.rawInput("请输入间隔(ms)", "0")
                .then(delay => {
                    if(delay==null){
                        return;
                    }
                    PRESET_DATA = storage.get("PRESET_DATA");
                    var clickListTemp;
                    for(var i=0;i<PRESET_DATA.length;i++){
                        if(PRESET_DATA[i].presetName == PRESET_NAME_LIST[presetIndex]){
                            clickListTemp = PRESET_DATA[i].clickList;
                            break;
                        }
                    }
                    clickListTemp.push({
                        words: words,
                        delay: delay,
                        matchType: matchType,
                        matchText: matchText
                    });
                    save(null, PRESET_DATA)
                });
            }).show();
    })
}
function deleteList(iv, ih){
    iv.remove.on("click", function(){
        confirm("确定删除条件[" + ih.item.words + "]吗？")
            .then(ok => {
                if (ok) {
                    PRESET_DATA = storage.get("PRESET_DATA");
                    var clickListTemp;
                    for(var i=0;i<PRESET_DATA.length;i++){
                        if(PRESET_DATA[i].presetName == PRESET_NAME_LIST[presetIndex]){
                            clickListTemp = PRESET_DATA[i].clickList;
                            break;
                        }
                    }
                    clickListTemp.splice(ih.position, 1);
                    save(null, PRESET_DATA)

                }
        });
    });}
// 点击启动
ui.launch.on("click",() => {launchBtn()})

// 点击预设名单
ui.preset.on("click",() => {presetBtn()})

// 删除预设
ui.deletePreset.on("click",() => {deletePresetBtn()})

// 添加明细
ui.add.on("click", () => {addBtn()});

// 删除明细
ui.list.on("item_bind", (itemView, itemHolder) => {deleteList(itemView, itemHolder)});

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
            <text id="tip" w="*" gravity="center" color="white" bg="#f56c6c" textSize="12sp" text="选好模式和软件，然后开始"></text>
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
            console.info(presetIndex)
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
            window.tip.setText(defaultTip);
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
        // ui模式打开
        ui.launch.setText("开始")
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