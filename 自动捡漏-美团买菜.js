console.show()
console.info("注意：提前取消预约的到货提醒")

//===============================================================================
//===================================可修改=================================
//===============================================================================
var textArray = ["洗衣液","纸"]; // 要捡漏的商品名
var singleInterval = 0.02; // 每个商品时间间隔（分钟）
var groupInterval = 2; // 每个循环时间间隔（分钟）
var ckTimeout = 1; // 检测卡住的时间限制（分钟）

//===============================================================================
//===================================基础配置=================================
//===============================================================================
const listData = [
    {words: "结算",matchType: 1,delay: 1000},
    {words: "我知道了",matchType: 0,delay: 0},
    {words: "返回购物车",matchType: 0,delay: 0},
    {words: "极速支付",matchType: 0,delay: 300},
    {words: "立即支付",matchType: 0,delay: 300},
    {words: "确认并支付",matchType: 0,delay: 0},
    {words: "重新加载",matchType: 0,delay: 500},
    {words: "免密支付",matchType: 0,delay: 1000}
];

// 开始
run();

// 主程序
function run(){
    console.info("打开美团买菜")
    launchApp("美团买菜")

    console.info("点击跳过")
    var stipBtnThread = threads.start(function () {
        clickTextOnce("跳过", 0)
    })
    var qrBtnThread = threads.start(function () {
        clickTextOnce("确认选择", 0)
    })

    for (let i=0,first=true,hasSuccess=false;;(i = (i + 1) == textArray.length ? 0 : i + 1)) {
        // 监测线程,震动提醒
        var ckThread = threads.start(() => {
            setTimeout(() => {
                console.info("检查一下是不是卡住了！！！")
                notify("检查一下是不是卡住了！！！");
            }, (ckTimeout+singleInterval*textArray.length+groupInterval) * 60 * 1000)
        })
        
        console.info("当前索引:" + i + " 商品:" + textArray[i])

        if (first) {
            clickTextOnce("搜索", 0)
            stipBtnThread.interrupt()
            qrBtnThread.interrupt()
            first = false;
        } else {
            console.info("点击搜索框")
            console.info(textArray[i==0?textArray.length-1:i-1])
            clickTextOnce(textArray[i==0?textArray.length-1:i-1],0)
            // className("android.view.ViewGroup").clickable(true).depth(15).findOne().click()
        }

        console.info("寻找输入框，输入商品名：" + textArray[i]);
        className("android.widget.EditText").findOne().setText(textArray[i])

        console.info("点击搜索")
        clickTextOnce("搜索")

        console.info("查看是否有货，等待 " + textArray[i] + " 的文字出现")
        while (true) {
            var tt = textContains(textArray[i]).untilFind();
            if (tt.length > 2) {
                break;
            }
            sleep(200);
        }
        console.info("查找￥，点击第一个商品")
        findParentClick(textContains("¥").untilFind()[0], 1)

        var dhtx, jrgwc;
        dhtx = threads.start(function () {
            console.info("判断出现‘到货提醒’")
            text("到货提醒我").waitFor();
            console.info("出现‘到货提醒’，返回，开始下一个商品’")
            sleep(100)
            jrgwc.interrupt()
        })
        jrgwc = threads.start(function () {
            console.info("判断出现‘加入购物车’")
            clickTextOnce("加入购物车")
            hasSuccess = true;
            dhtx.interrupt()
        })
        dhtx.join()
        jrgwc.join()
        ckThread.interrupt()
        if (i == textArray.length-1) {
            if(hasSuccess){
                sleep(singleInterval*60*1000)
                break;
            } else {
                console.info("延迟"+groupInterval+"分钟再开始下一循环")
                sleep(groupInterval*60*1000)
            }
        }
        console.info("延迟"+singleInterval+"分钟再开始下一个")
        sleep(singleInterval*60*1000)
        for(let i=0;i<3;i++){
            back();
            if(text("综合").findOne(2000)){
                break;
            }
        }
    }
    console.info("查找数字，进入购物车")
    var matchNums = textMatches("\\d+").find();
    matchNums[matchNums.length-1].parent().parent().click();

    console.info("震动提醒")
    threads.start(() => {
        successShock();
    })

    console.info("全选购物车")
    seelctAllcart();
    
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
    for (i = 0; i < 5; i++) {
        device.vibrate(300)
        sleep(500)
        device.vibrate(1000)
        sleep(1500)
    }
}
// 警报震动 19秒
function alertShock() {
    for (i = 0; i < 10; i++) {
        device.vibrate(300)
        sleep(300)
        device.vibrate(800)
        sleep(800)
        device.vibrate(400)
        sleep(800)
    }
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
//===================================文字点击部分=================================
//===============================================================================
// 随机延迟
var randomDelayMin = 100;
var randomDelayMaxn = 300;
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
        let randomDelay = Math.random()*(randomDelayMaxn-randomDelayMin)+randomDelayMin;
        sleep(d==0?randomDelay:(d+randomDelay));
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
