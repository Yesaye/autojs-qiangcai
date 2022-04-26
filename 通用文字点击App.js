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



// 初始化参数
// storages.remove("tywzdj")
var version = "1.1.0";
var floatyRunning = false;
var allData = []; // 当前加载的的allData
var listData = []; // 当前预设的listData
var presetMenu = []; // 预设名单
var presetMenuIndex = 0; // 当前预设索引

var storage = storages.create("yesaye-tywzdj");
checkUpdateShowInfo();
firstInit();
loadData();

////////////////////////////////////////////////////////////////////////////////////
// 隐私协议
function checkUpdateShowInfo(){
    if(storage.contains("updateInfo") && storage.get("updateInfo")==version){
        return;
    } else {
        // 展示隐私信息
        dialogs.build({
            title: "隐私协议",
            content: "千手观音是一款建议功能的文字点击器，可以帮您在必要的时候实现多处循环点击的操作。为了让用户能更加放心的使用，我们应用不会接入互联网，用户记录的所有数据均会存储于用户自己的设备中。\n\n隐私政策属于本应用中不可或缺的一部分，请先点击阅读浏览隐私协议",
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
    if(!storage.contains("allData") || storage.get("allData").length==0){
        allData = [
            {
                presetName:"美团买菜",rjqc:"美团买菜",
                listData:
                    [
                        {words:"结算",matchType:1,delay:1000,matchText:"左模糊[结算]"},
                        {words:"我知道了",matchType:0,delay:0,matchText:"精确[我知道了]"},
                        {words:"返回购物车",matchType:0,delay:0,matchText:"精确[返回购物车]"},
                        {words:"极速支付",matchType:0,delay:0,matchText:"精确[极速支付]"},
                        {words:"立即支付",matchType:0,delay:0,matchText:"精确[立即支付]"},
                        {words:"确认并支付",matchType:0,delay:0,matchText:"精确[确认并支付]"}
                    ]
            },
            {
                presetName:"叮咚买菜",rjqc:"叮咚买菜",
                listData:
                    [
                        {words:"去结算",matchType:1,delay:0,matchText:"左模糊[去结算]"},
                        {words:"返回购物车",matchType:0,delay:0,matchText:"精确[返回购物车]"},
                        {words:"立即支付",matchType:0,delay:0,matchText:"精确[立即支付]"},
                        {words:"重新加载",matchType:0,delay:0,matchText:"精确[重新加载]"}
                    ]
            }
        ];
        save(null, allData)
    }
}

// 重新加载数据
function loadData(){
    allData = storage.get("allData", false);
    presetMenu = [];
    listData = [];
    if(allData){
        if(allData.length>0){
            // 加载预设名单
            allData.forEach(a=>{
                presetMenu.push(a.presetName);
            });
            // 加载当前预设内容
            choicePreset(presetMenu[presetMenuIndex])
        }
    } else {
        save(null, [])
    }
}

// 选择预设 pName-预设名
function choicePreset(pName){
    allData = storage.get("allData");
    for(var i=0;i<allData.length;i++){
        if(allData[i].presetName==pName){
            presetMenuIndex = presetMenu.indexOf(pName);
            listData = allData[i].listData
            ui.list.setDataSource(listData);
            ui.preset.setText("预设 ["+pName+"]");
            return;
        }
    }
    // 删完了的情况
    listData = [];
    ui.list.setDataSource(listData);
    ui.preset.setText("预设 [无]");
}

// 保存数据 tips-提示 data-数据
function save(tips, data){
    if(tips){
        toast(tips)
    }
    storage.put("allData", data)
    loadData()
}

// 获取软件全称
function getRjqc(){
    allData = storage.get("allData");
    for(var i=0;i<allData.length;i++) {
        if(allData[i].presetName==presetMenu[presetMenuIndex]){
            return allData[i].rjqc;
        }
    }
}


////////////////////////////////////////////////////////////////////////////////////
// 点击启动
ui.launch.on("click",function(){
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
        if(listData && listData.length>0){
            var appName = getRjqc();
            if(appName){
                toast("正在打开["+appName+"]")
                app.launchApp(appName)
            }
            // 打开悬浮窗
            showFloaty()
            ui.launch.setText("请在悬浮窗操作")
        } else {
            ui.launch.setText("点什么点，请先添加内容！")
            setTimeout(()=>{ui.launch.setText("启动")},3000)
        }
    }
})

// 点击预设名单
ui.preset.on("click",function(){
    allData = storage.get("allData");
    var menu = presetMenu.slice()
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
                for(var i=0;i<allData.length;i++){
                    if(allData[i].presetName==pn){
                        toast("该预设已存在")
                        return;
                    }
                }
                dialogs.rawInput("请确认对应软件的全称", pn)
                .then(rjqc => {
                    if(!rjqc){
                        return;
                    }
                    allData.push({"presetName":pn,"rjqc":rjqc,"listData":[]})
                    save(null, allData)
                    choicePreset(pn)
                })
            });
        } else if(i==1) {
            // 导出预设
            for(var i=0;i<allData.length;i++){
                if(allData[i].presetName==presetMenu[presetMenuIndex]){
                    setClip(JSON.stringify(allData[i]))
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
                for(var i=0;i<allData.length;i++){
                    if(allData[i].presetName==jsonData.presetName){
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
                        for(var i=0;i<allData.length;i++){
                            if(allData[i].presetName==pn){
                                sameName = true;
                                break;
                            }
                        }
                        if(sameName){
                            toast("预设名依然重复")
                        } else {
                            jsonData.presetName = pn;
                            allData.push(jsonData)
                            save(null, allData)
                            choicePreset(pn)
                        }
                    });
                } else {
                    allData.push(jsonData)
                    save(null, allData)
                    choicePreset(jsonData.presetName)
                }
            });
        } else {
            // 选择预设
            choicePreset(presetMenu[i-3])
        }
    });
})

// 删除预设
ui.deletePreset.on("click",function(){
    if(!presetMenu[presetMenuIndex]){
        toast("已经没有啦~")
        return;
    }
    confirm("确定删除预设[" + presetMenu[presetMenuIndex] + "]吗？")
    .then(ok => {
        if (ok) {
            allData = storage.get("allData");
            var err = true;
            for(var i=0;i<allData.length;i++){
                if(allData[i].presetName==presetMenu[presetMenuIndex]){
                    allData.splice(i, 1);
                    err = false
                    break;
                }
            }
            if(err){
                toast("删除未成功")
                return;
            }
            save(null, allData);
            choicePreset(presetMenu[presetMenuIndex=0]);
            toast("删除成功")
        }
    });
})

// 添加明细
ui.add.on("click", () => {
    dialogs.rawInput("请输入要点击的文字")
        .then(words => {
            if (!words) {
                return;
            }
            dialogs.build({
                title: "查找类型",
                items: ["精确查询["+words+"]", "左模糊["+words+"]", "右模糊["+words+"]", "全模糊["+words+"]"],
                itemsSelectMode: "single",
                itemsSelectedIndex: 0
            }).on("single_choice", (matchType, matchText)=>{
                 dialogs.rawInput("请输入间隔(ms)", "0")
                    .then(delay => {
                        if(delay==null){
                            return;
                        }
                        allData = storage.get("allData");
                        var listDataTemp;
                        for(var i=0;i<allData.length;i++){
                            if(allData[i].presetName == presetMenu[presetMenuIndex]){
                                listDataTemp = allData[i].listData;
                                break;
                            }
                        }
                        listDataTemp.push({
                            words: words,
                            delay: delay,
                            matchType: matchType,
                            matchText: matchText
                        });
                        save(null, allData)
                    });
                }).show();
        })
});

// 删除明细
ui.list.on("item_bind", function (itemView, itemHolder) {
    itemView.remove.on("click", function(){
        confirm("确定删除条件[" + itemHolder.item.words + "]吗？")
            .then(ok => {
                if (ok) {
                    allData = storage.get("allData");
                    var listDataTemp;
                    for(var i=0;i<allData.length;i++){
                        if(allData[i].presetName == presetMenu[presetMenuIndex]){
                            listDataTemp = allData[i].listData;
                            break;
                        }
                    }
                    listDataTemp.splice(itemHolder.position, 1);
                    save(null, allData)

                }
        });
    });
});


////////////////////////////////////////////////////////////////////////////////////
// 向上搜寻点击
function findParentClick(p,deep){
    if(p.clickable()){
        p.click();
    } else {
        if((deep++)>6){
            toast("click err")
            return;
        }
        findParentClick(p.parent())
    }
}

// 基础点击方法 t-文字 d-延迟 m-匹配类型
function clickText(t, d, m) {
    console.info("初始化线程:" + t + " " + d + " " + m)
    var j = 1;
    while (true) {
        var temp = m==0 ? text(t) : 
                   m==1 ? textStartsWith(t) : 
                   m==2 ? textEnds(t) : 
                   textContains(t);
        if (temp.exists) {
            findParentClick(temp.findOne(), 1)
            console.info("第" + j++ + "次'" + t + "'")
        }
        if (d != 0) {
            sleep(d)
        }
    }
}

// 批量开启文字点击线程
function startClickThreads(){
    var tArray = new Array();
    for (var i = 0; i < listData.length; i++) {
        (function abc(j) {
            tArray[j] = threads.start(function () {
                clickText(listData[j].words,listData[j].delay,listData[j].matchType)
            })
        })(i)
    }
}


////////////////////////////////////////////////////////////////////////////////////
// 创建悬浮窗（ui模式下需要在线程里创建悬浮窗）
function showFloaty(){
    floatyRunning = true;
    var xfcThread = threads.start(function(){
        var excuting = false;
        var window = floaty.window(
            <vertical id="boxFloaty">
                <button id="moveFloaty" text="位置"/>
                <button id="startFloaty" style="Widget.AppCompat.Button.Colored" text="开始"/>
                <button id="stopFloaty" style="Widget.AppCompat.Button.Colored" text="暂停"/>
                <button id="exitFloaty" text="结束"/>
            </vertical>
        );

        // 开始执行
        window.startFloaty.on("click", () => {
            if(!excuting){
                window.startFloaty.setText("正在运行")
                window.boxFloaty.setAlpha(0.5)
                startClickThreads()
                window.disableFocus()
                excuting = true;
            }
        });
        // 暂停
        window.stopFloaty.on("click", () => {
            if(excuting){
                window.startFloaty.setText("开始")
                window.boxFloaty.setAlpha(1)
                threads.shutDownAll()
                window.disableFocus();
                excuting=false;
            }
        });
        // 关闭悬浮窗
        window.exitFloaty.on("click", () => {
            // 关闭所有线程
            threads.shutDownAll()
            // 关闭悬浮窗
            floaty.closeAll()
            ui.launch.setText("开始")
            floatyRunning = false;
        });
        // 移动悬浮窗
        window.moveFloaty.on("click", () => {
            window.setAdjustEnabled(!window.isAdjustEnabled());
        });
    })
}