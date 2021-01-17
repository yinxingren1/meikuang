var layer;
var measureIds = [];
var handler;
var layindex;
var tileset; //高程
$(document).ready(function() {
    layui.use('layer', function() { //独立版的layer无需执行这一句
        layer = layui.layer; //独立版的layer无需执行这一句
    });
    $(".widget-btn").on("click", function() {
        let id = $(this).attr("data-id");
        layer.close(layindex);
        switch (id) {
            case "measure":
                showMeasureDialog();
                break;
            case "analysis":
                showAnalysisDialog();
                break;
            case "drawHelpper":
                drawHelpper();
                break;
            default:
                break;
        }
    })
    $("#menu-point").on("click", function() {
        layer.close(layindex);
        layindex = layer.open({
            title: '坐标定位',
            type: 1,
            offset: ['10%', '87%'],
            skin: 'layer-mars-dialog',
            scrollbar: false,
            shade: 0,
            area: ['208px', '200px'], //宽高
            content: getPoint(),
            success: function(layero, index) {
                let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
                handler.setInputAction(function(event) {
                    var earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
                    if (Cesium.defined(earthPosition)) {
                        let ellipsoid = viewer.scene.globe.ellipsoid;
                        let cartographic = ellipsoid.cartesianToCartographic(earthPosition);
                        let lat = Cesium.Math.toDegrees(cartographic.latitude);
                        let lon = Cesium.Math.toDegrees(cartographic.longitude);
                        let height = Cesium.Math.toDegrees(cartographic.height);
                        let params = {
                            id: '点',
                            name: 'text',
                            lon: lon,
                            lat: lat,
                            pixelSize: height
                        };
                        AddPoint(params);
                        $('#point_jd').val(lon);
                        $('#point_wd').val(lat);
                        $('#point_height').val(height);
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
        })
    })
    $("#menu-scale").on("click", function() {
        if (CesiumNavigation.distanceLegendDiv.hidden)
            CesiumNavigation.distanceLegendDiv.hidden = false;
        else {
            CesiumNavigation.distanceLegendDiv.hidden = true;
        }
    })
    $("#menu-line").on("click", function() {
        tileset = new Cesium.Cesium3DTileset({
            url: 'http://earthsdk.com/v/last/Apps/assets/dayanta/tileset.json'
        });
        viewer.scene.primitives.add(tileset);
        tileset.readyPromise.then(function(tileset) {
            //调整位置
            var modelPos = Cesium.Cartesian3.fromDegrees(108.9594, 34.2195, 3.05);
            var m = Cesium.Transforms.eastNorthUpToFixedFrame(modelPos);
            tileset._root.transform = m;
        });
        viewer.flyTo(tileset);
        measureClampDistance(viewer);
    })
    $("#menu-area").on("click", function() {
        if (!tileset) {
            tileset = new Cesium.Cesium3DTileset({
                url: 'http://earthsdk.com/v/last/Apps/assets/dayanta/tileset.json'
            });
            viewer.scene.primitives.add(tileset);
            tileset.readyPromise.then(function(tileset) {
                //调整位置
                var modelPos = Cesium.Cartesian3.fromDegrees(108.9594, 34.2195, 3.05);
                var m = Cesium.Transforms.eastNorthUpToFixedFrame(modelPos);
                tileset._root.transform = m;
            });
            viewer.flyTo(tileset);
        }
        measureAreaSpace(viewer);
    })
    $("#menu-clear").on("click", function() {

        viewer.entities.removeAll();

        if (tooltip) {
            tooltip.closeAll()
        }
        query3Dtiles.clearsel();
    })


})


//量测对话框
function showMeasureDialog() {
    $('#dropdown-menu').hide();
    layindex = layer.open({
        title: '图上量算',
        type: 1,
        offset: ['10%', '80%'],
        skin: 'layer-mars-dialog',
        scrollbar: false,
        shade: 0,
        area: ['310px', '500px'], //宽高
        content: getMeasureHtml(),
        success: function(layero, index) {
            $(".tool-btn").on("click", function(e) {
                let id = $(this).attr("id");
                if (id == 'btn_measure_length') {
                    measureLineSpace(viewer);
                } else if (id == 'btn_measure_height') {
                    _altitude(viewer);
                } else if (id == 'btn_measure_length_td') {
                    measureClampDistance(viewer);
                } else if (id == 'btn_measure_area') {
                    measureAreaSpace(viewer);
                } else if (id == 'btn_measure_angle') {
                    _measureAngle(viewer);
                } else if (id == 'btn_measure_supHeight') {
                    _Triangle(viewer);
                }
            })
            $('#btn_measure_clear').on("click", function(e) {
                drawRemove(viewer);
            })
        }

    })
}

function showAnalysisDialog() {
    layindex = layer.open({
        title: '空间分析',
        type: 1,
        offset: ['10%', '80%'],
        skin: 'layer-mars-dialog',
        scrollbar: false,
        shade: 0,
        area: ['310px', '500px'], //宽高
        content: getAnalysisHtml(),
        success: function(layero, index) {
            $(".tool-btn").on("click", function(e) {
                let id = $(this).attr("id");
                if (id == 'btn_measure_length') {
                    measureLineSpace(viewer);
                } else if (id == 'btn_measure_height') {
                    _altitude(viewer);
                } else if (id == 'btn_measure_length_td') {
                    measureClampDistance(viewer);
                } else if (id == 'btn_measure_area') {
                    measureAreaSpace(viewer);
                } else if (id == 'btn_measure_angle') {
                    _measureAngle(viewer);
                } else if (id == 'btn_measure_supHeight') {
                    _Triangle(viewer);
                }
            })
            $('#btn_measure_clear').on("click", function(e) {
                drawRemove(viewer);
            })
        }

    })
}

function getPoint() {
    var html = `<div class="centerXY">
        <div class="input-group">
            <span class="input-group-addon" id="basic-addon1">经度</span>
            <input type="number" id="point_jd" class="form-control"  placeholder="请输入经度数值0-180" aria-describedby="basic-addon1" value="116.40040608710233">
        </div>
        <div class="input-group">
            <span class="input-group-addon" id="basic-addon2">纬度</span>
            <input type="number" id="point_wd" class="form-control"  placeholder="请输入纬度数值0-90" aria-describedby="basic-addon2" value="40.000379538848456">
        </div>
        <div class="input-group">
            <span class="input-group-addon" id="basic-addon2">高度</span>
            <input type="number" id="point_height" class="form-control"  placeholder="请输入高度值" aria-describedby="basic-addon2" value="10">
        </div>
        <div class="input-group text-right">
            <input id="btnCenterXY" type="button" onclick="btnCenterXY()" class="btn btn-primary" value="确定"></div>
        </div>`;
    return html;
}
//添加点
function btnCenterXY() {
    var lon = parseFloat($('#point_jd').val());
    var lat = parseFloat($('#point_wd').val());
    var height = parseFloat($('#point_height').val());
    let params = {

        lon: lon,
        lat: lat,
        pixelSize: height
    };
    AddPoint(params);
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(params.lon, params.lat) });
}

function AddPoint(params) {
    viewer.entities.removeById('点');
    if (params.lon === undefined || params.lat === undefined) {
        alert('请提供经纬度!');
        return;
    }
    var entity = new Cesium.Entity({
        id: '点',
        position: Cesium.Cartesian3.fromDegrees(params.lon, params.lat, params.pixelSize),
        billboard: {
            image: "./img/marker.png",

        },
    });
    viewer.entities.add(entity);
    return entity;
}

//测量贴模型距离
var measureClampDistance = function(viewer) {

    var terrainProvider = viewer.terrainProvider;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    // 取消双击事件-追踪该位置
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType
        .LEFT_DOUBLE_CLICK);

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    // var tooltip = document.getElementById("toolTip");
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    // tooltip.style.display = "block";

    handler.setInputAction(function(movement) {
        // tooltip.style.left = movement.endPosition.x + 3 + "px";
        // tooltip.style.top = movement.endPosition.y - 25 + "px";
        // tooltip.innerHTML = '<p>单击开始，右击结束</p>';
        cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!Cesium.defined(cartesian)) {
            let ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        let p = Cesium.Cartographic.fromCartesian(cartesian);
        p.height = viewer.scene.sampleHeight(p);
        cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(p);
        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
        if (positions.length >= 2) {
            if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions);
            } else {
                positions.pop();
                // cartesian.y += (1 + Math.random());
                positions.push(cartesian);
            }
            // console.log("distance: " + distance);
            // tooltip.innerHTML='<p>'+distance+'米</p>';
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {
        // tooltip.style.display = "none";
        // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        cartesian = viewer.scene.pickPosition(movement.position);
        if (!Cesium.defined(cartesian)) {
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        let p = Cesium.Cartographic.fromCartesian(cartesian);
        p.height = viewer.scene.sampleHeight(p);
        cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(p);
        if (positions.length == 0) {
            positions.push(cartesian.clone());
        }
        positions.push(cartesian);
        getSpaceDistance(positions);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(movement) {
        handler.destroy(); //关闭事件句柄
        positions.pop(); //最后一个点无效
        // viewer.entities.remove(floatingPoint);
        // tooltip.style.display = "none";
        viewer._container.style.cursor = "";
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    var PolyLinePrimitive = (function() {
        function _(positions) {
            this.options = {
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    material: Cesium.Color.GOLD,
                    width: 2,
                    clampToGround: true
                }
            };
            this.positions = positions;
            this._init();
        }

        _.prototype._init = function() {
            var _self = this;
            var _update = function() {
                return _self.positions;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
            measureIds.push(et.id);
        };

        return _;
    })();

    //空间两点距离计算函数
    function getSpaceDistance(positions) {
        var distance_ = 0;
        if (positions.length > 2) {
            var positions_ = [];
            var sp = Cesium.Cartographic.fromCartesian(positions[positions.length - 3]);
            var ep = Cesium.Cartographic.fromCartesian(positions[positions.length - 2]);
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(sp, ep);
            var s = geodesic.surfaceDistance;
            positions_.push(sp);
            var num = parseInt((s / 100).toFixed(0));
            num = num > 200 ? 200 : num;
            num = num < 20 ? 20 : num;
            for (var i = 1; i < num; i++) {
                var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cesium.Cartographic());
                res.height = viewer.scene.sampleHeight(res);
                positions_.push(res);
            }
            positions_.push(ep);
            // var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions_);
            // Cesium.when(promise, function (updatedPositions) {
            for (var ii = 0; ii < positions_.length - 1; ii++) {
                geodesic.setEndPoints(positions_[ii], positions_[ii + 1]);
                var d = geodesic.surfaceDistance;
                distance_ = Math.sqrt(Math.pow(d, 2) + Math.pow(positions_[ii + 1].height - positions_[ii]
                    .height,
                    2)) + distance_;
            }
            distance = parseFloat(distance_.toFixed(2));
            //在三维场景中添加Label
            var textDisance = distance + "米";
            if (distance > 1000) {
                textDisance = (distance / 1000).toFixed(3) + "千米";
            }
            floatingPoint = viewer.entities.add({
                name: '空间直线距离',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.GOLD,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -20),
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            measureIds.push(floatingPoint.id);
            // });
        }
    }
    //空间两点距离计算函数
    function getSpaceDistance_(positions) {
        var distance_ = 0;
        if (positions.length > 2) {
            var positions_ = [];
            var sp = Cesium.Cartographic.fromCartesian(positions[positions.length - 3]);
            var ep = Cesium.Cartographic.fromCartesian(positions[positions.length - 2]);
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(sp, ep);
            var s = geodesic.surfaceDistance;
            positions_.push(sp);
            var num = parseInt((s / 100).toFixed(0));
            num = num > 200 ? 200 : num;
            num = num < 20 ? 20 : num;
            for (var i = 1; i < num; i++) {
                var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cesium.Cartographic());
                positions_.push(res);
            }
            positions_.push(ep);
            var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions_);
            Cesium.when(promise, function(updatedPositions) {
                for (var ii = 0; ii < positions_.length - 1; ii++) {
                    geodesic.setEndPoints(positions_[ii], positions_[ii + 1]);
                    var d = geodesic.surfaceDistance;
                    distance_ = Math.sqrt(Math.pow(d, 2) + Math.pow(positions_[ii + 1].height - positions_[ii]
                        .height,
                        2)) + distance_;
                }
                distance = parseFloat(distance_.toFixed(2));
                //在三维场景中添加Label
                var textDisance = distance + "米";
                if (distance > 1000) {
                    textDisance = (distance / 1000).toFixed(3) + "千米";
                }
                floatingPoint = viewer.entities.add({
                    name: '空间直线距离',
                    position: positions[positions.length - 1],
                    point: {
                        pixelSize: 5,
                        color: Cesium.Color.RED,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                    },
                    label: {
                        text: textDisance,
                        font: '18px sans-serif',
                        fillColor: Cesium.Color.GOLD,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(20, -20),
                    }
                });
                measureIds.push(floatingPoint.id);
            });
        }
    }

}

function getMeasureHtml() {
    var html = `<div id="" class="layui-layer-content"><div class="btn-group">
	<div id="btn_measure_length" class="tool-btn">
		<div class="tool-thum" style="background:#dd751b">
			<img src="image/measure-length.svg" alt="&#x7A7A;&#x95F4;&#x8DDD;&#x79BB;">
		</div>
		<span class="btn_none">&#x7A7A;&#x95F4;&#x8DDD;&#x79BB;</span>
	</div>
	<div id="btn_measure_length_td" class="tool-btn">
		<div class="tool-thum" style="background:#c092fe">
			<img src="image/measure-length2.svg" alt="&#x8D34;&#x5730;&#x8DDD;&#x79BB;">
		</div>
		<span class="btn_none">&#x8D34;&#x5730;&#x8DDD;&#x79BB;</span>
	</div>
	<div id="btn_measure_area" class="tool-btn">
		<div class="tool-thum" style="background:#3de3f4">
			<img src="image/measure-area.svg" alt="&#x9762;&#x79EF;">
		</div>
		<span class="btn_none">&#x6C34;&#x5E73;&#x9762;&#x79EF;</span>
	</div>
	<div id="btn_measure_angle" class="tool-btn">
		<div class="tool-thum" style="background:#95d333">
			<img src="image/measure-angle.svg" alt="&#x89D2;&#x5EA6;">
		</div>
		<span class="btn_none">&#x89D2;&#x5EA6;</span>
	</div>
	<div id="btn_measure_height" class="tool-btn">
		<div class="tool-thum" style="background:#55d5a0">
			<img src="image/measure-height.svg" alt="&#x9AD8;&#x5EA6;&#x5DEE;">
		</div>
		<span class="btn_none">&#x9AD8;&#x5EA6;&#x5DEE;</span>
	</div>
	<div id="btn_measure_supHeight" class="tool-btn">
		<div class="tool-thum" style="background:#37bc41">
			<img src="image/measure-height-sup.svg" alt="&#x4E09;&#x89D2;&#x6D4B;&#x91CF;">
		</div>
		<span class="btn_none">&#x4E09;&#x89D2;&#x6D4B;&#x91CF;</span>
	</div>
	<div id="btn_measure_point" class="tool-btn">
		<div class="tool-thum" style="background:#babc31">
			<img src="image/measure-coor.svg" alt="&#x5750;&#x6807;&#x6D4B;&#x91CF;">
		</div>
		<span class="btn_none">&#x5750;&#x6807;&#x6D4B;&#x91CF;</span>
	</div>
</div>

<div style="margin-top:5px">
	<span id="lbl_measure_result" style="font-size:16px"></span>
</div>
<div style="text-align:center;">
	<button id="btn_measure_clear" type="button" class="btn" style="background:#07f;color:#fff;text-align:center;margin-top:15px;border-radius:15px;padding-left:30px;padding-right:30px">清除</button>
</div></div>`;
    return html;
}

function getAnalysisHtml() {
    var html = `<div class="btn-group">
    <div id="btn_goto_rzfx" class="tool-btn">
    <div class="tool-thum" style="background:#dd751b">
    <img src="img/rzfx.svg" alt="日照分析"></div>
    <span class="btn_none">日照分析</span></div>
    <div id="btn_goto_ksy" class="tool-btn">
    <div class="tool-thum" style="background:#c092fe">
    <img src="img/ksy.svg" alt="可视域"></div>
    <span class="btn_none">可视域</span></div>
    <div id="btn_goto_flfx" class="tool-btn">
    <div class="tool-thum" style="background:#88b8ff">
    <img src="img/flfx.svg" alt="方量分析"></div>
    <span class="btn_none">方量分析</span></div>
    <div id="btn_goto_dxkw" class="tool-btn">
    <div class="tool-thum" style="background:#55d5a0">
    <img src="img/dxkw.svg" alt="地形开挖"></div>
    <span class="btn_none">地形开挖</span></div>
    <div id="btn_goto_dbtm" class="tool-btn">
    <div class="tool-thum" style="background:#b85555"><img src="img/dbtm.svg" alt="地表透明"></div>
    <span class="btn_none">地表透明</span></div><div id="btn_goto_pdpx" class="tool-btn">
    <div class="tool-thum" style="background:#3de3f4"><img src="img/pdpx.svg" alt="坡度坡向">
    </div><span class="btn_none">坡度坡向</span></div><div id="btn_goto_mxpq" class="tool-btn">
    <div class="tool-thum" style="background:#37bc41"><img src="img/mxpq.svg" alt="模型剖切"></div>
    <span class="btn_none">模型剖切</span></div><div id="btn_goto_mxyp" class="tool-btn">
    <div class="tool-thum" style="background:#95d333"><img src="img/mxyp.svg" alt="模型压平"></div>
    <span class="btn_none">模型压平</span></div><div id="btn_goto_mxcj" class="tool-btn">
    <div class="tool-thum" style="background:#babc31"><img src="img/mxcj.svg" alt="模型裁剪"></div>
    <span class="btn_none">模型裁剪</span></div></div>`;
    return html;
}

//简单高程
var measureHeight = function(viewer) {
    var handler_g = handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    var height = 0;
    var cartesian = null;
    var floatingPoint;


    handler.setInputAction(function(movement) {

        cartesian = viewer.scene.pickPosition(movement.endPosition);

        console.log(positions);
        if (positions.length >= 2) {
            if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions);
            } else {
                positions.pop();
                positions.push(cartesian);
            }
            height = getHeight(positions);
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {


        cartesian = viewer.scene.pickPosition(movement.position);

        if (positions.length == 0) {
            positions.push(cartesian.clone());
            positions.push(cartesian);

            floatingPoint_g = floatingPoint = viewer.entities.add({
                //parent:measure_entities,
                name: '高度',
                position: positions[0],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.none
                },
                label: {
                    text: "0米",
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.GOLD,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -40)
                }
            });
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(movement) {
        handler.destroy();
        //positions.pop();//清除移动点			

        //viewer_g.entities.remove(floatingPoint);
        // console.log(positions);
        //在三维场景中添加Label

        var textDisance = height + "米";

        var point1cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
        var point2cartographic = Cesium.Cartographic.fromCartesian(positions[1]);
        var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);


        viewer.entities.add({
            //parent:measure_entities,
            name: '直线距离',
            position: point_temp,
            point: {
                pixelSize: 5,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.none
            },
            label: {
                text: textDisance,
                font: '18px sans-serif',
                fillColor: Cesium.Color.GOLD,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20)
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    function getHeight(_positions) {
        var cartographic = Cesium.Cartographic.fromCartesian(_positions[0]);
        var cartographic1 = Cesium.Cartographic.fromCartesian(_positions[1]);
        var height_temp = cartographic1.height - cartographic.height;
        return height_temp.toFixed(2);
    }

    var PolyLinePrimitive = (function() {
        function _(positions) {
            this.options = {
                //parent:measure_entities,
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    material: Cesium.Color.AQUA,
                    width: 2
                },
                ellipse: {
                    show: true,
                    // semiMinorAxis : 30.0,
                    // semiMajorAxis : 30.0,
                    // height: 20.0,
                    material: Cesium.Color.GREEN.withAlpha(0.5),
                    outline: true // height must be set for outline to display
                }
            };
            this.positions = positions;
            this._init();
        }

        _.prototype._init = function() {
            var _self = this;
            var _update = function() {
                var temp_position = [];
                temp_position.push(_self.positions[0]);
                var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
                var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
                var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);
                temp_position.push(point_temp);
                console.log(temp_position);
                return temp_position;
            };
            var _update_ellipse = function() {
                return _self.positions[0];
            };
            var _semiMinorAxis = function() {
                var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
                var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
                /**根据经纬度计算出距离**/
                var geodesic = new Cesium.EllipsoidGeodesic();
                geodesic.setEndPoints(point1cartographic, point2cartographic);
                var s = geodesic.surfaceDistance;
                return s;
            };
            var _height = function() {
                var height_temp = getHeight(_self.positions);
                return height_temp;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
            this.options.position = new Cesium.CallbackProperty(_update_ellipse, false);
            this.options.ellipse.semiMinorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
            this.options.ellipse.semiMajorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
            this.options.ellipse.height = new Cesium.CallbackProperty(_height, false);
            viewer.entities.add(this.options);
        };

        return _;
    })();
};

//空间距离
function measureLineSpace(viewer) {

    // 取消双击事件-追踪该位置
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    var positions = [];
    var poly = null;
    // var tooltip = document.getElementById("toolTip");
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    // tooltip.style.display = "block";

    handler.setInputAction(function(movement) {
        //移动结束位置
        cartesian = viewer.scene.pickPosition(movement.endPosition);
        //判断点是否在画布上
        if (Cesium.defined(cartesian)) {
            if (positions.length >= 2) {
                if (!Cesium.defined(poly)) {
                    //画线
                    poly = new PolyLinePrimitive(positions);
                } else {
                    positions.pop();
                    // cartesian.y += (1 + Math.random());
                    positions.push(cartesian);
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {
        cartesian = viewer.scene.pickPosition(movement.position);

        if (Cesium.defined(cartesian)) {
            if (positions.length == 0) {
                positions.push(cartesian.clone());
            }
            positions.push(cartesian);
            distance = getSpaceDistance(positions);
            //在三维场景中添加Label
            var textDisance = distance + "米";
            if (distance > 1000) {
                textDisance = (parseFloat(distance) / 1000).toFixed(3) + "千米";
            }
            floatingPoint = viewer.entities.add({
                name: '空间直线距离',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.CHARTREUSE,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -20),
                    heightReference: Cesium.HeightReference.NONE
                }
            });
            measureIds.push(floatingPoint.id);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(movement) {
        handler.destroy(); //关闭事件句柄
        positions.pop(); //最后一个点无效
        viewer._container.style.cursor = "";

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    var PolyLinePrimitive = (function() {
        function _(positions) {
            this.options = {
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    arcType: Cesium.ArcType.NONE,
                    // material: new Cesium.PolylineOutlineMaterialProperty({
                    //     color: Cesium.Color.CHARTREUSE
                    // }),
                    material: Cesium.Color.CHARTREUSE,
                    // depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                    //     color: Cesium.Color.RED
                    // }),
                    width: 2
                }
            };
            this.positions = positions;
            this._init();
        }

        _.prototype._init = function() {
            var _self = this;
            var _update = function() {
                return _self.positions;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
            measureIds.push(et.id);
        };

        return _;
    })();

    //空间两点距离计算函数
    function getSpaceDistance(positions) {
        var distance = 0;
        for (var i = 0; i < positions.length - 1; i++) {

            var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
            var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
            /**根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            var s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            distance = distance + s;
        }
        return distance.toFixed(2);
    }
}

//****************************测量空间面积************************************************//
function measureAreaSpace(viewer) {
    // 取消双击事件-追踪该位置
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    // 鼠标事件
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var tempPoints = [];
    var polygon = null;
    // var tooltip = document.getElementById("toolTip");
    var cartesian = null;
    var floatingPoint; //浮动点
    // tooltip.style.display = "block";

    handler.setInputAction(function(movement) {
        // tooltip.style.left = movement.endPosition.x + 3 + "px";
        // tooltip.style.top = movement.endPosition.y - 25 + "px";
        // tooltip.innerHTML ='<p>单击开始，右击结束</p>';
        // cartesian = viewer.scene.pickPosition(movement.endPosition); 
        let ray = viewer.camera.getPickRay(movement.endPosition);
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
        if (positions.length >= 2) {
            if (!Cesium.defined(polygon)) {
                polygon = new PolygonPrimitive(positions);
            } else {
                positions.pop();
                // cartesian.y += (1 + Math.random());
                positions.push(cartesian);
            }
            // tooltip.innerHTML='<p>'+distance+'米</p>';
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {
        // tooltip.style.display = "none";
        // cartesian = viewer.scene.pickPosition(movement.position); 
        let ray = viewer.camera.getPickRay(movement.position);
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (positions.length == 0) {
            positions.push(cartesian.clone());
        }
        //positions.pop();
        positions.push(cartesian);
        //在三维场景中添加点
        var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
        var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        var heightString = cartographic.height;
        tempPoints.push({ lon: longitudeString, lat: latitudeString, hei: heightString });
        floatingPoint = viewer.entities.add({
            name: '多边形面积',
            position: positions[positions.length - 1],
            point: {
                pixelSize: 5,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(movement) {
        handler.destroy();
        positions.pop();
        //tempPoints.pop();
        // viewer.entities.remove(floatingPoint);
        // tooltip.style.display = "none";
        //在三维场景中添加点
        // var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
        // var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        // var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        // var heightString = cartographic.height;
        // tempPoints.push({ lon: longitudeString, lat: latitudeString ,hei:heightString});

        var textArea = getArea(tempPoints) + "平方公里";
        viewer.entities.add({
            name: '多边形面积',
            position: positions[positions.length - 1],
            // point : {
            //  pixelSize : 5,
            //  color : Cesium.Color.RED,
            //  outlineColor : Cesium.Color.WHITE,
            //  outlineWidth : 2,
            //  heightReference:Cesium.HeightReference.CLAMP_TO_GROUND 
            // },
            label: {
                text: textArea,
                font: '18px sans-serif',
                fillColor: Cesium.Color.GOLD,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -40),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    var radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad) 
    var degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

    //计算多边形面积
    function getArea(points) {

        var res = 0;
        //拆分三角曲面

        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            var totalAngle = Angle(points[i], points[j], points[k]);


            var dis_temp1 = distance(positions[i], positions[j]);
            var dis_temp2 = distance(positions[j], positions[k]);
            res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
            console.log(res);
        }


        return (res / 1000000.0).toFixed(4);
    }

    /*角度*/
    function Angle(p1, p2, p3) {
        var bearing21 = Bearing(p2, p1);
        var bearing23 = Bearing(p2, p3);
        var angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    /*方向*/
    function Bearing(from, to) {
        var lat1 = from.lat * radiansPerDegree;
        var lon1 = from.lon * radiansPerDegree;
        var lat2 = to.lat * radiansPerDegree;
        var lon2 = to.lon * radiansPerDegree;
        var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        angle = angle * degreesPerRadian; //角度
        return angle;
    }

    var PolygonPrimitive = (function() {
        function _(positions) {
            this.options = {
                name: '多边形',
                polygon: {
                    hierarchy: [],
                    // perPositionHeight : true,
                    material: Cesium.Color.GREEN.withAlpha(0.5),
                    // heightReference:20000
                }
            };

            this.hierarchy = { positions };
            this._init();
        }

        _.prototype._init = function() {
            var _self = this;
            var _update = function() {
                return _self.hierarchy;
            };
            //实时更新polygon.hierarchy
            this.options.polygon.hierarchy = new Cesium.CallbackProperty(_update, false);
            viewer.entities.add(this.options);
        };

        return _;
    })();

    function distance(point1, point2) {
        var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
        var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        return s;
    }
}



//高度差

function _altitude(viewer) {


    var trianArr = [];

    var distanceLineNum = 0;

    var Line1, Line2;

    var H;

    var floatingPoint; //浮动点

    // 取消双击事件-追踪该位置

    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType

        .LEFT_DOUBLE_CLICK);

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.endPosition);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.endPosition);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }

        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);

        if (distanceLineNum === 1) {

            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

            var lon = Cesium.Math.toDegrees(cartographic.longitude);

            var lat = Cesium.Math.toDegrees(cartographic.latitude);

            var MouseHeight = cartographic.height;

            trianArr.length = 3;

            trianArr.push(lon, lat, MouseHeight);

            draw_Triangle();

        }

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.position);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.position);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }



        // var cartesian = viewer.scene.pickPosition(movement.position);

        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

        var lon = Cesium.Math.toDegrees(cartographic.longitude);

        var lat = Cesium.Math.toDegrees(cartographic.latitude);

        var MouseHeight = cartographic.height;



        floatingPoint = viewer.entities.add({

            name: '多边形面积',

            position: cartesian,

            point: {

                pixelSize: 3,

                color: Cesium.Color.RED,

                outlineColor: Cesium.Color.WHITE,

                outlineWidth: 2,

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

            }

        });

        measureIds.push(floatingPoint.id);



        distanceLineNum++;

        if (distanceLineNum === 1) {

            trianArr.push(lon, lat, MouseHeight);



        } else {

            trianArr.length = 3;

            trianArr.push(lon, lat, MouseHeight);

            handler.destroy();


            viewer._container.style.cursor = "";

            draw_Triangle();

        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);



    handler.setInputAction(function(movement) {

        handler.destroy();

        viewer._container.style.cursor = "";

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);



    function draw_Triangle() {

        if (Cesium.defined(Line1)) {

            //更新三角线

            Line1.polyline.positions = trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([

                trianArr[0],

                trianArr[1], trianArr[5], trianArr[0], trianArr[1], trianArr[2]

            ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[

                3], trianArr[4], trianArr[5]]);

            Line2.polyline.positions = trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([

                trianArr[0],

                trianArr[1], trianArr[5], trianArr[3], trianArr[4],

                trianArr[5]

            ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[

                0], trianArr[1], trianArr[2]]);



            //高度

            var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);

            H.position = trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (

                trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (

                trianArr[2] + trianArr[5]) / 2);

            H.label.text = '高度差:' + height + '米';

            return;

        }

        Line1 = viewer.entities.add({

            name: 'triangleLine',

            polyline: {

                positions: trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0],

                    trianArr[1], trianArr[5], trianArr[0], trianArr[1], trianArr[2]

                ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[

                    3], trianArr[4], trianArr[5]]),

                arcType: Cesium.ArcType.NONE,

                width: 2,

                material: new Cesium.PolylineOutlineMaterialProperty({

                    color: Cesium.Color.CHARTREUSE

                }),

                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({

                    color: Cesium.Color.RED

                })

            }

        });

        measureIds.push(Line1.id);

        Line2 = viewer.entities.add({

            name: 'triangleLine',

            polyline: {

                positions: trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0],

                    trianArr[1], trianArr[5], trianArr[3], trianArr[4],

                    trianArr[5]

                ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[

                    0], trianArr[1], trianArr[2]]),

                arcType: Cesium.ArcType.NONE,

                width: 2,



                // material: new Cesium.PolylineOutlineMaterialProperty({

                material: new Cesium.PolylineDashMaterialProperty({

                    color: Cesium.Color.CHARTREUSE,

                    // dashLength: 5,

                    // dashPattern: 10,

                    // gapColor:Cesium.Color.YELLOW

                }),

                // depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({

                depthFailMaterial: new Cesium.PolylineDashMaterialProperty({

                    color: Cesium.Color.RED

                })

            }

        });

        measureIds.push(Line2.id);



        // 空间

        var lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1]),

            Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4])).toFixed(2);

        //高度

        var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);

        H = viewer.entities.add({

            name: 'lineZ',

            position: trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (

                trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (

                trianArr[2] + trianArr[5]) / 2),

            label: {

                text: '高度差:' + height + '米',

                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),

                font: '45px 楷体',

                fillColor: Cesium.Color.WHITE,

                outlineColor: Cesium.Color.BLACK,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,

                outlineWidth: 3,

                disableDepthTestDistance: 1000000000,

                scale: 0.5,

                pixelOffset: new Cesium.Cartesian2(0, -10),

                backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),

                backgroundPadding: new Cesium.Cartesian2(10, 10),

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM

            }

        });

        measureIds.push(H.id);

    }

}



//三角测量

function _Triangle(viewer) {

    var trianArr = [];

    var distanceLineNum = 0;

    var XLine;

    var X, Y, H;

    var floatingPoint; //浮动点

    // 取消双击事件-追踪该位置

    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType

        .LEFT_DOUBLE_CLICK);

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.endPosition);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.endPosition);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }

        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);

        if (distanceLineNum === 1) {

            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

            var lon = Cesium.Math.toDegrees(cartographic.longitude);

            var lat = Cesium.Math.toDegrees(cartographic.latitude);

            var MouseHeight = cartographic.height;

            trianArr.length = 3;

            trianArr.push(lon, lat, MouseHeight);

            draw_Triangle();

        }

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.position);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.position);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }



        // var cartesian = viewer.scene.pickPosition(movement.position);

        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

        var lon = Cesium.Math.toDegrees(cartographic.longitude);

        var lat = Cesium.Math.toDegrees(cartographic.latitude);

        var MouseHeight = cartographic.height;



        floatingPoint = viewer.entities.add({

            name: '多边形面积',

            position: cartesian,

            point: {

                pixelSize: 3,

                color: Cesium.Color.RED,

                outlineColor: Cesium.Color.WHITE,

                outlineWidth: 2,

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

            }

        });

        measureIds.push(floatingPoint.id);



        distanceLineNum++;

        if (distanceLineNum === 1) {

            trianArr.push(lon, lat, MouseHeight);



        } else {

            trianArr.length = 3;

            trianArr.push(lon, lat, MouseHeight);

            handler.destroy();

            viewer._container.style.cursor = "";

            draw_Triangle();

        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);



    handler.setInputAction(function(movement) {

        handler.destroy();

        viewer._container.style.cursor = "";

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);



    function draw_Triangle() {

        if (Cesium.defined(XLine)) {

            //更新三角线

            XLine.polyline.positions = trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([

                trianArr[0],

                trianArr[1], trianArr[2], trianArr[0], trianArr[1], trianArr[5], trianArr[3], trianArr[4],

                trianArr[5], trianArr[0], trianArr[1], trianArr[2]

            ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0], trianArr[1], trianArr[2],

                trianArr[3], trianArr[4], trianArr[5], trianArr[3], trianArr[4], trianArr[2], trianArr[0],

                trianArr[1], trianArr[2]

            ]);



            // 空间

            var lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1]),

                Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4])).toFixed(2);

            //高度

            var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);

            //直线距离

            var strLine = (Math.sqrt(Math.pow(lineDistance, 2) + Math.pow(height, 2))).toFixed(2);



            X.position = Cesium.Cartesian3.fromDegrees((trianArr[0] + trianArr[3]) / 2, (trianArr[1] + trianArr[

                4]) / 2, Math.max(trianArr[2], trianArr[5]));

            H.position = trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (

                trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (

                trianArr[2] + trianArr[5]) / 2);

            Y.position = Cesium.Cartesian3.fromDegrees((trianArr[0] + trianArr[3]) / 2, (trianArr[1] + trianArr[

                4]) / 2, (trianArr[2] + trianArr[5]) / 2);

            X.label.text = '空间距离:' + lineDistance + '米';

            H.label.text = '高度差:' + height + '米';

            Y.label.text = '直线距离:' + strLine + '米';

            return;

        }

        XLine = viewer.entities.add({

            name: 'triangleLine',

            polyline: {

                positions: trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0],

                    trianArr[1], trianArr[2], trianArr[0], trianArr[1], trianArr[5], trianArr[3], trianArr[4],

                    trianArr[5], trianArr[0], trianArr[1], trianArr[2]

                ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0], trianArr[1], trianArr[2],

                    trianArr[3], trianArr[4], trianArr[5], trianArr[3], trianArr[4], trianArr[2], trianArr[0],

                    trianArr[1], trianArr[2]

                ]),

                arcType: Cesium.ArcType.NONE,

                width: 2,

                material: new Cesium.PolylineOutlineMaterialProperty({

                    color: Cesium.Color.YELLOW

                }),

                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({

                    color: Cesium.Color.RED

                })

            }

        });

        measureIds.push(XLine.id);



        // 空间

        var lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1]),

            Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4])).toFixed(2);

        //高度

        var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);

        //直线距离

        var strLine = (Math.sqrt(Math.pow(lineDistance, 2) + Math.pow(height, 2))).toFixed(2);

        X = viewer.entities.add({

            name: 'lineX',

            position: Cesium.Cartesian3.fromDegrees((trianArr[0] + trianArr[3]) / 2, (trianArr[1] + trianArr[

                4]) / 2, Math.max(trianArr[2], trianArr[5])),

            label: {

                text: '空间距离:' + lineDistance + '米',

                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),

                font: '45px 楷体',

                fillColor: Cesium.Color.WHITE,

                outlineColor: Cesium.Color.BLACK,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,

                outlineWidth: 3,

                disableDepthTestDistance: 1000000000,

                scale: 0.5,

                pixelOffset: new Cesium.Cartesian2(0, -10),

                backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),

                backgroundPadding: new Cesium.Cartesian2(10, 10),

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM

            }

        });

        measureIds.push(X.id);

        H = viewer.entities.add({

            name: 'lineZ',

            position: trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (

                trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (

                trianArr[2] + trianArr[5]) / 2),

            label: {

                text: '高度差:' + height + '米',

                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),

                font: '45px 楷体',

                fillColor: Cesium.Color.WHITE,

                outlineColor: Cesium.Color.BLACK,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,

                outlineWidth: 3,

                disableDepthTestDistance: 1000000000,

                scale: 0.5,

                pixelOffset: new Cesium.Cartesian2(0, -10),

                backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),

                backgroundPadding: new Cesium.Cartesian2(10, 10),

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM

            }

        });

        measureIds.push(H.id);

        Y = viewer.entities.add({

            name: 'lineY',

            position: Cesium.Cartesian3.fromDegrees((trianArr[0] + trianArr[3]) / 2, (trianArr[1] + trianArr[

                4]) / 2, (trianArr[2] + trianArr[5]) / 2),

            label: {

                text: '直线距离:' + strLine + '米',

                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),

                font: '45px 楷体',

                fillColor: Cesium.Color.WHITE,

                outlineColor: Cesium.Color.BLACK,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,

                outlineWidth: 3,

                disableDepthTestDistance: 1000000000,

                scale: 0.5,

                pixelOffset: new Cesium.Cartesian2(0, -10),

                backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),

                backgroundPadding: new Cesium.Cartesian2(10, 10),

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM

            }

        });

        measureIds.push(Y.id);

    }

}



//方位角

function _measureAngle(viewer) {

    var pArr = [];

    var distanceLineNum = 0;

    var Line1;

    var Line2;

    var angleT;

    var floatingPoint; //浮动点

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.endPosition);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.endPosition);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }

        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);

        if (distanceLineNum === 1) {

            pArr.length = 1;

            pArr.push(cartesian);

            draw_Angle();

        }

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(movement) {

        var cartesian = viewer.scene.pickPosition(movement.position);

        if (!Cesium.defined(cartesian)) {

            var ray = viewer.camera.getPickRay(movement.position);

            cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        }

        // var cartesian = viewer.scene.pickPosition(movement.position);



        distanceLineNum++;

        if (distanceLineNum === 1) {

            pArr.push(cartesian);

            floatingPoint = viewer.entities.add({

                name: '方位角',

                position: cartesian,

                point: {

                    pixelSize: 3,

                    color: Cesium.Color.RED,

                    outlineColor: Cesium.Color.WHITE,

                    outlineWidth: 2,

                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

                }

            });

            measureIds.push(floatingPoint.id);

        } else {

            pArr.length = 1;

            pArr.push(cartesian);

            handler.destroy();



            viewer._container.style.cursor = "";

            draw_Angle();

        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);



    handler.setInputAction(function(movement) {

        handler.destroy();



        viewer._container.style.cursor = "";

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);



    function draw_Angle() {

        // 空间

        var cartographic1 = Cesium.Cartographic.fromCartesian(pArr[0]);

        var lon1 = Cesium.Math.toDegrees(cartographic1.longitude);

        var lat1 = Cesium.Math.toDegrees(cartographic1.latitude);

        var cartographic2 = Cesium.Cartographic.fromCartesian(pArr[1]);

        var lon2 = Cesium.Math.toDegrees(cartographic2.longitude);

        var lat2 = Cesium.Math.toDegrees(cartographic2.latitude);

        var lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(lon1, lat1),

            Cesium.Cartesian3.fromDegrees(lon2, lat2));

        var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(lon1, lat1));

        var NorthPoint = Cesium.Cartographic.fromCartesian(Cesium.Matrix4.multiplyByPoint(localToWorld_Matrix, Cesium

            .Cartesian3.fromElements(0,

                lineDistance,

                0), new Cesium.Cartesian3()));

        var npLon = Cesium.Math.toDegrees(NorthPoint.longitude);

        var npLat = Cesium.Math.toDegrees(NorthPoint.latitude);

        // var angle = Cesium.Cartesian3.angleBetween(Cesium.Cartesian3.fromDegrees(lon1, lat1),

        //     Cesium.Cartesian3.fromDegrees(lon2, lat2));

        var angle = courseAngle(lon1, lat1, lon2, lat2);

        var textDisance = lineDistance.toFixed(2) + "米";

        if (lineDistance > 1000) {

            textDisance = (lineDistance / 1000).toFixed(3) + "千米";

        }

        if (Cesium.defined(Line1)) {

            //更新线

            Line1.polyline.positions = new Cesium.Cartesian3.fromDegreesArray([lon1, lat1, npLon, npLat]);

            Line2.polyline.positions = new Cesium.Cartesian3.fromDegreesArray([lon1, lat1, lon2, lat2]);

            angleT.label.text = '角度:' + angle + '°\n距离:' + textDisance;

            angleT.position = pArr[1];

            return;

        }

        //北方线

        Line1 = viewer.entities.add({

            name: 'Angle1',

            polyline: {

                positions: new Cesium.Cartesian3.fromDegreesArray([lon1, lat1, npLon, npLat]),

                width: 3,

                material: new Cesium.PolylineDashMaterialProperty({

                    color: Cesium.Color.RED

                }),

                clampToGround: true

            }

        });

        measureIds.push(Line1.id);

        //线

        Line2 = viewer.entities.add({

            name: 'Angle2',

            polyline: {

                positions: new Cesium.Cartesian3.fromDegreesArray([lon1, lat1, lon2, lat2]),

                width: 10,

                material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW),

                clampToGround: true

            }

        });

        measureIds.push(Line2.id);



        //文字

        angleT = viewer.entities.add({

            name: 'AngleT',

            position: pArr[1],

            label: {

                text: '角度:' + angle + '°\n距离:' + textDisance,

                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),

                font: '45px 楷体',

                fillColor: Cesium.Color.WHITE,

                outlineColor: Cesium.Color.BLACK,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,

                outlineWidth: 4,

                scale: 0.5,

                pixelOffset: new Cesium.Cartesian2(0, -40),

                // disableDepthTestDistance: 1000000000,

                backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 1)"),

                backgroundPadding: new Cesium.Cartesian2(10, 10),

                verticalOrigin: Cesium.VerticalOrigin.BASELINE

            }

        });

        measureIds.push(angleT.id);

    }



    function courseAngle(lng_a, lat_a, lng_b, lat_b) {

        /////////////方法

        var dRotateAngle = Math.atan2(Math.abs(lng_a - lng_b), Math.abs(lat_a - lat_b));

        if (lng_b >= lng_a) {

            if (lat_b >= lat_a) {} else {

                dRotateAngle = Math.PI - dRotateAngle;

            }

        } else {

            if (lat_b >= lat_a) {

                dRotateAngle = 2 * Math.PI - dRotateAngle;

            } else {

                dRotateAngle = Math.PI + dRotateAngle;

            }

        }

        dRotateAngle = dRotateAngle * 180 / Math.PI;

        return parseInt(dRotateAngle * 100) / 100;



        /////方法

        // //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵

        // var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3.fromDegrees(lng_a, lat_a));

        // //求世界坐标到局部坐标的变换矩阵

        // var worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());

        // //a点在局部坐标的位置，其实就是局部坐标原点

        // var localPosition_A = Cesium.Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cesium.Cartesian3.fromDegrees(lng_a, lat_a), new Cesium.Cartesian3());

        // //B点在以A点为原点的局部的坐标位置

        // var localPosition_B = Cesium.Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cesium.Cartesian3.fromDegrees(lng_b, lat_b), new Cesium.Cartesian3());

        // //弧度

        // var angle = Math.atan2((localPosition_B.y - localPosition_A.y), (localPosition_B.x - localPosition_A.x))

        // //角度

        // var theta = angle * (180 / Math.PI);

        // if (theta < 0) {

        //     theta = theta + 360;

        // }

        // return theta.toFixed(2);

    }

}
//清楚
function drawRemove(viewer) {
    viewer.entities.removeAll();
    for (var i = 0; i < mapvLayers.length; i++) {
        var mapvLayer = mapvLayers[i];
        if (mapvLayer) {
            mapvLayer.destroy();
            mapvLayer = {};
        }
    }
}