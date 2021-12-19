var lsClient = new LightstreamerClient("https://push.lightstreamer.com","ISSLIVE");
lsClient.connectionOptions.setSlowingEnabled(false);

// USLAB000032: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - X (km)
// USLAB000033: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - Y (km)
// USLAB000034: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - Z (km)
// USLAB000035: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - X (m/s)
// USLAB000036: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - Y (m/s)
// USLAB000037: US Guidance, Navigation and Control (GNC) J2000 Propagated State Vector - Z (m/s)

var ISS = {osvIn : {r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null}, 
            osvProp: {r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null},
            kepler : {a : 0}, 
            r_ECEF : [0, 0, 0],
            v_ECEF : [0, 0, 0],
            alt : 0,
            lon : 0, 
            lat : 0};

// 2021-11-19T00:48:00.000 1177.728237468290 5164.721874219340 4253.469200418660 -5.31709062754173 4.18055793285909 -3.60015717277952
// 2021-11-19T01:24:00.000 -3965.751738576390 -1516.756797548700 -5313.467867110320 3.16262545363373 -6.95629150850218 -0.37867153148092

ISS.osvIn.r = [-4228282.012, 4080666.827, -3421191.697];
ISS.osvIn.v = [-1904.50887, -5821.53009, -4594.77013];
ISS.osvIn.ts = new Date("November 20, 2021 19:28:04");

var osvOut = {};
osvOut.r = [-4228282.012, 4080666.827, -3421191.697];
osvOut.v = [-1904.50887, -5821.53009, -4594.77013];
osvOut.ts = new Date("November 20, 2021 19:28:04");
osvOut.numLoaded = 0;

const sub = new Subscription("MERGE",["USLAB000032", "USLAB000033", "USLAB000034", 
"USLAB000035", "USLAB000036", "USLAB000037"], ["TimeStamp","Value"]);

const timeSub = new Subscription('MERGE', 'TIME_000001', ['TimeStamp','Value','Status.Class','Status.Indicator']);
lsClient.subscribe(sub);
lsClient.subscribe(timeSub);
lsClient.connect();

sub.addListener(
{
onSubscription: function() 
{
    console.log("Subscribed");
},
onUnsubscription: function() 
{
    console.log("Unsubscribed");
},
onItemUpdate: function(update) 
{
    console.log(update.getItemName() + ": " + update.getValue("Value"))

    let ts = TimeConversions.timeStampToDate(update.getValue("TimeStamp"));
    if (ts.getTime() !== osvOut.ts.getTime())
    {
        osvOut.numLoaded = 0;
        osvOut.ts = ts;
    }

    if (update.getItemName() == "USLAB000032")
    {
        osvOut.r[0] = parseFloat(update.getValue("Value")) * 1000.0;
        osvOut.numLoaded++;
    }
    if (update.getItemName() == "USLAB000033")
    {
        osvOut.r[1] = parseFloat(update.getValue("Value")) * 1000.0;
        osvOut.numLoaded++;
    }
    if (update.getItemName() == "USLAB000034")
    {
        osvOut.r[2] = parseFloat(update.getValue("Value")) * 1000.0;
        osvOut.numLoaded++;
    }
    if (update.getItemName() == "USLAB000035")
    {
        osvOut.v[0] = parseFloat(update.getValue("Value"));
        osvOut.numLoaded++;
    }
    if (update.getItemName() == "USLAB000036")
    {
        osvOut.v[1] = parseFloat(update.getValue("Value"));
        osvOut.numLoaded++;
    }
    if (update.getItemName() == "USLAB000037")
    {
        osvOut.v[2] = parseFloat(update.getValue("Value"));
        osvOut.numLoaded++;
    }

    const invalidPosition = MathUtils.norm(osvOut.r) == 0.0;
    const invalidVelocity = MathUtils.norm(osvOut.v) == 0.0;

    //console.log(osvOut.numLoaded);
    if (osvOut.numLoaded == 6)
    {
        if (!invalidPosition && !invalidVelocity)
        {
            ISS.osvIn.ts = osvOut.ts;
            ISS.osvIn.r = osvOut.r;
            ISS.osvIn.v = osvOut.v;
        }
        else
        {
            console.log("Invalid telemetry. Ignoring.");
        }
    }
}
});