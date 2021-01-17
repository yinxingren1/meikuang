import './plotUtil.js'
import './algorithm.js'
import './GlobeTooltip.js'
import './GlobePolygonDrawer.js'
import './GlobePolylineDrawer.js'
import './GlobeRectangleDrawer.js'
import './GlobeCircleDrawer.js'
import './GlobePointDrawer.js'
import './GlobeBufferLineDrawer.js'
// import './GlobePointMeasure.js'
// import './GlobePolylineSpaceMeasure.js'
// import './GlobePolylineStickMeasure.js'
// import './GlobePolygonMeasure.js'
import './PlotStraightArrowDrawer.js'
import './PlotAttackArrowDrawer.js'
import './PlotPincerArrowDrawer.js'
import './GlobeTracker.js'
class draw {
    constructor(opt) {

        this.viewer = opt.viewer;
        this.tracker = null;
        //图层名称
        this.layerId = "drawerLayer_" + Cesium.createGuid();
        //全局变量，用来记录shape坐标信息
        this.shapeDic = {};
        //编辑或删除标识,1为编辑，2为删除
        this.flag = 0;
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        this.addHtml();
        this.initDrawHelper();
        this.bindGloveEvent();
    }
    close() {
        if (this.handler && !this.handler.isDestroyed())
            this.handler = this.handler && this.handler.destroy();
    }
    addHtml() {
        var html = `<div style="position:absolute;left:10px;top:10px;background-color:transparent;">
        <input id="drawPolygon" type="button" class="layui-btn layui-btn-sm layui-btn-normal" value="绘制多边形" />
        <input id="drawPolyline" type="button" class="layui-btn layui-btn-sm layui-btn-normal" value="绘制折线" />
        <input id="drawRectangle" type="button" class="layui-btn layui-btn-sm layui-btn-normal" value="绘制矩形" />
        <input id="drawCircle" type="button" class="layui-btn layui-btn-sm layui-btn-normal" value="绘制圆" />
        <input id="drawPoint" type="button" class="layui-btn layui-btn-sm layui-btn-normal" value="绘制点" />
        </div>
    <div style="position:absolute;left:10px;top:130px;background-color:transparent;">
        <input id="deleteShape" type="button" class="layui-btn layui-btn-sm layui-btn-primary" value="删除图形" />
        <input id="deleteShapeall" type="button" class="layui-btn layui-btn-sm layui-btn-primary" value="删除所有" />
    </div>`;

        $("#drawdialog").html(html);
    }
    initDrawHelper() {
        var this_ = this;
        this_.tracker = new window.GlobeTracker(viewer);

        $("#drawPolygon").click(function () {
            this_.flag = 0;
            this_.tracker.trackPolygon(function (positions) {
                var objId = (new Date()).getTime();
                this_.shapeDic[objId] = positions;
                this_.showPolygon(objId, positions);

            });
        });
        $("#drawPolyline").click(function () {
            this_.flag = 0;
            this_.tracker.trackPolyline(function (positions) {
                var objId = (new Date()).getTime();
                this_.shapeDic[objId] = positions;
                this_.showPolyline(objId, positions);
            });
        });
        $("#drawRectangle").click(function () {
            this_.flag = 0;
            this_.tracker.trackRectangle(function (positions) {
                var objId = (new Date()).getTime();
                this_.shapeDic[objId] = positions;
                this_.showRectangle(objId, positions);
            });
        });
        $("#drawCircle").click(function () {
            this_.flag = 0;
            this_.tracker.trackCircle(function (positions) {
                var objId = (new Date()).getTime();
                this_.shapeDic[objId] = positions;
                this_.showCircle(objId, positions);
            });
        });
        $("#drawPoint").click(function () {
            this_.flag = 0;
            this_.tracker.trackPoint(function (position) {
                var objId = (new Date()).getTime();
                this_.shapeDic[objId] = position;
                this_.showPoint(objId, position);
            });
        });
        // $("#drawBufferLine").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.trackBufferLine(function (positions, radius) {
        //         var objId = (new Date()).getTime();
        //         this_.shapeDic[objId] = {
        //             positions: positions,
        //             radius: radius
        //         };
        //         this_.showBufferLine(objId, positions, radius);
        //     });
        // });

        // $("#posMeasure").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.pickPosition(function (position, lonLat) {
        //     });
        // });
        // $("#spaceDisMeasure").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.pickSpaceDistance(function (positions, rlt) {
        //     });
        // });
        // $("#stickDisMeasure").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.pickStickDistance(function (positions, rlt) {
        //     });
        // });
        // $("#areaMeasure").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.pickArea(function (positions, rlt) {
        //     });
        // });

        // $("#straightArrow").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.trackStraightArrow(function (positions) {
        //         var objId = (new Date()).getTime();
        //         this_.shapeDic[objId] = positions;
        //         this_.showStraightArrow(objId, positions);
        //     });
        // });
        // $("#attackArrow").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.trackAttackArrow(function (positions, custom) {
        //         var objId = (new Date()).getTime();
        //         this_.shapeDic[objId] = {
        //             custom: custom,
        //             positions: positions
        //         };
        //         this_.showAttackArrow(objId, positions);
        //     });
        // });
        // $("#pincerArrow").click(function () {
        //     this_.flag = 0;
        //     this_.tracker.trackPincerArrow(function (positions, custom) {
        //         var objId = (new Date()).getTime();
        //         this_.shapeDic[objId] = {
        //             custom: custom,
        //             positions: positions
        //         };
        //         this_.showPincerArrow(objId, positions);
        //     });
        // });

        $("#editShape").click(function () {
            layer.msg("点击要编辑的箭头！");
            this_.flag = 1;
            //清除标绘状态
            this_.tracker.clear();
        });
        $("#deleteShape").click(function () {
            layer.msg("点击要删除的箭头！");
            this_.flag = 2;
            //清除标绘状态
            this_.tracker.clear();
        });
        $("#deleteShapeall").click(function () {
            this_.flag = 0;
            //清除标绘状态
            this_.clearAllEntity();
        });

    }
    //绑定cesiu事件
    bindGloveEvent() {
        var this_ = this;
        this_.handler.setInputAction(function (movement) {
            var pick = this_.viewer.scene.pick(movement.position);
            if (!pick) {
                return;
            }
            var obj = pick.id;
            if (!obj || !obj.layerId || this_.flag == 0) {
                return;
            }
            var objId = obj.objId;
            //this_.flag为编辑或删除标识,1为编辑，2为删除
            if (this_.flag == 1) {
                switch (obj.shapeType) {
                    case "Polygon":
                        this_.flag = 0;
                        this_.editPolygon(objId);
                        break;
                    case "Polyline":
                        this_.flag = 0;
                        this_.editPolyline(objId);
                        break;
                    case "Rectangle":
                        this_.flag = 0;
                        this_.editRectangle(objId);
                        break;
                    case "Circle":
                        this_.flag = 0;
                        this_.editCircle(objId);
                        break;
                    case "Point":
                        this_.flag = 0;
                        this_.editPoint(objId);
                        break;
                    case "BufferLine":
                        this_.flag = 0;
                        this_.editBufferLine(objId);
                        break;
                    case "StraightArrow":
                        this_.flag = 0;
                        this_.editStraightArrow(objId);
                        break;
                    case "AttackArrow":
                        this_.flag = 0;
                        this_.editAttackArrow(objId);
                        break;
                    case "PincerArrow":
                        this_.flag = 0;
                        this_.editPincerArrow(objId);
                        break;
                    default:
                        break;
                }
            } else if (this_.flag == 2) {
                this_.clearEntityById(objId);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    showPolygon(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
        });
        var outlinePositions = [].concat(positions);
        outlinePositions.push(positions[0]);
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "Polygon",
            polyline: {
                positions: outlinePositions,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            },
            polygon: new Cesium.PolygonGraphics({
                hierarchy: positions,
                asynchronous: false,
                material: material
            })
        };
        var entity = this.viewer.entities.add(bData);
    }
    showPolyline(objId, positions) {
        var material = new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)
        });
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "Polyline",
            polyline: {
                positions: positions,
                clampToGround: true,
                width: 8,
                material: material
            }
        };
        var entity = this.viewer.entities.add(bData);
    }
    showRectangle(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
        });
        var rect = Cesium.Rectangle.fromCartesianArray(positions);
        var arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west, rect.north];
        var outlinePositions = Cesium.Cartesian3.fromRadiansArray(arr);
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "Rectangle",
            polyline: {
                positions: outlinePositions,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            },
            rectangle: {
                coordinates: rect,
                material: material
            }
        };
        var entity = this.viewer.entities.add(bData);
    }
    showCircle(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
        });
        var radiusMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
        });
        var pnts = this.tracker.circleDrawer._computeCirclePolygon(positions);
        var dis = this.tracker.circleDrawer._computeCircleRadius3D(positions);
        dis = (dis / 1000).toFixed(3);
        var text = dis + "km";
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "Circle",
            position: positions[0],
            label: {
                text: text,
                font: '16px Helvetica',
                fillColor: Cesium.Color.SKYBLUE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -9000)),
                pixelOffset: new Cesium.Cartesian2(16, 16)
            },
            billboard: {
                image: "image/circle_center.png",
                eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            polyline: {
                positions: positions,
                clampToGround: true,
                width: 2,
                material: radiusMaterial
            },
            polygon: new Cesium.PolygonGraphics({
                hierarchy: pnts,
                asynchronous: false,
                material: material
            })
        };
        var entity = this.viewer.entities.add(bData);

        var outlineBdata = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "Circle",
            polyline: {
                positions: pnts,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            }
        };
        var outlineEntity = this.viewer.entities.add(outlineBdata);
    }
    showPoint(objId, position) {
        var entity = this.viewer.entities.add({
            layerId: this.layerId,
            objId: objId,
            shapeType: "Point",
            position: position,
            billboard: {
                image: "image/circle_red.png",
                eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
    }
    showBufferLine(objId, positions, radius) {
        var buffer = this.tracker.bufferLineDrawer.computeBufferLine(positions, radius);
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var lineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
        });
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "BufferLine",
            polygon: new Cesium.PolygonGraphics({
                hierarchy: buffer,
                asynchronous: false,
                material: material
            }),
            polyline: {
                positions: positions,
                clampToGround: true,
                width: 2,
                material: lineMaterial
            }
        };
        var entity = this.viewer.entities.add(bData);
    }
    showStraightArrow(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
        });
        var outlinePositions = [].concat(positions);
        outlinePositions.push(positions[0]);
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "StraightArrow",
            polyline: {
                positions: outlinePositions,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            },
            polygon: new Cesium.PolygonGraphics({
                hierarchy: positions,
                asynchronous: false,
                material: material
            })
        };
        var entity = this.viewer.entities.add(bData);
    }
    showAttackArrow(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
        });
        var outlinePositions = [].concat(positions);
        outlinePositions.push(positions[0]);
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "AttackArrow",
            polyline: {
                positions: outlinePositions,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            },
            polygon: new Cesium.PolygonGraphics({
                hierarchy: positions,
                asynchronous: false,
                material: material
            })
        };
        var entity = this.viewer.entities.add(bData);
    }
    showPincerArrow(objId, positions) {
        var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
        var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
            dashLength: 16,
            color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
        });
        var outlinePositions = [].concat(positions);
        outlinePositions.push(positions[0]);
        var bData = {
            layerId: this.layerId,
            objId: objId,
            shapeType: "PincerArrow",
            polyline: {
                positions: outlinePositions,
                clampToGround: true,
                width: 2,
                material: outlineMaterial
            },
            polygon: new Cesium.PolygonGraphics({
                hierarchy: positions,
                asynchronous: false,
                material: material
            })
        };
        var entity = this.viewer.entities.add(bData);
    }

    editPolygon(objId) {
        var oldPositions = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.polygonDrawer.showModifyPolygon(oldPositions, function (positions) {
            this.shapeDic[objId] = positions;
            showPolygon(objId, positions);
        }, function () {
            showPolygon(objId, oldPositions);
        });
    }
    editPolyline(objId) {
        var oldPositions = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.polylineDrawer.showModifyPolyline(oldPositions, function (positions) {
            this.shapeDic[objId] = positions;
            showPolyline(objId, positions);
        }, function () {
            showPolyline(objId, oldPositions);
        });
    }
    editRectangle(objId) {
        var oldPositions = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.rectDrawer.showModifyRectangle(oldPositions, function (positions) {
            this.shapeDic[objId] = positions;
            showRectangle(objId, positions);
        }, function () {
            showRectangle(objId, oldPositions);
        });
    }
    editCircle(objId) {
        var oldPositions = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.circleDrawer.showModifyCircle(oldPositions, function (positions) {
            this.shapeDic[objId] = positions;
            showCircle(objId, positions);
        }, function () {
            showCircle(objId, oldPositions);
        });
    }
    editPoint(objId) {
        var oldPosition = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.pointDrawer.showModifyPoint(oldPosition, function (position) {
            this.shapeDic[objId] = position;
            showPoint(objId, position);
        }, function () {
            showPoint(objId, oldPosition);
        });
    }
    editBufferLine(objId) {
        var old = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.bufferLineDrawer.showModifyBufferLine(old.positions, old.radius, function (positions, radius) {
            this.shapeDic[objId] = {
                positions: positions,
                radius: radius
            };
            showBufferLine(objId, positions, radius);
        }, function () {
            showBufferLine(old.positions, old.radius, oldPositions);
        });
    }
    editStraightArrow(objId) {
        var oldPositions = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        //进入编辑状态  
        this.tracker.straightArrowDrawer.showModifyStraightArrow(oldPositions, function (positions) {
            this.shapeDic[objId] = positions;
            showStraightArrow(objId, positions);
        }, function () {
            showStraightArrow(objId, oldPositions);
        });
    }
    editAttackArrow(objId) {
        var old = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        this.tracker.attackArrowDrawer.showModifyAttackArrow(old.custom, function (positions, custom) {
            //保存编辑结果
            this.shapeDic[objId] = {
                custom: custom,
                positions: positions
            };
            showAttackArrow(objId, positions);
        }, function () {
            showAttackArrow(objId, old.positions);
        });
    }
    editPincerArrow(objId) {
        var old = this.shapeDic[objId];

        //先移除entity
        clearEntityById(objId);

        this.tracker.pincerArrowDrawer.showModifyPincerArrow(old.custom, function (positions, custom) {
            //保存编辑结果
            this.shapeDic[objId] = {
                custom: custom,
                positions: positions
            };
            showPincerArrow(objId, positions);
        }, function () {
            showPincerArrow(objId, old.positions);
        });
    }

    clearEntityById(objId) {
        var entityList = this.viewer.entities.values;
        if (entityList == null || entityList.length < 1) {
            return;
        }
        for (var i = 0; i < entityList.length; i++) {
            var entity = entityList[i];
            if (entity.layerId == this.layerId && entity.objId == objId) {
                this.viewer.entities.remove(entity);
                delete this.shapeDic[objId]
                i--;
            }
        }
    }
    clearAllEntity() {
        var entityList = this.viewer.entities.values;
        if (entityList == null || entityList.length < 1) {
            return;
        }
        var keylist = this.getObjectKeys(this.shapeDic);
        for (var i = 0; i < entityList.length; i++) {
            var entity = entityList[i];
            if (entity.layerId == this.layerId && $.inArray(entity.objId, keylist)) {
                this.viewer.entities.remove(entity);
                i--;
            }
        }
        this.shapeDic = {};
    }
    getObjectKeys(object) {
        var keys = [];
        for (var property in object)
            keys.push(property);
        return keys;
    }
}
window.drawHelpper = function () {
    if ($("#drawdialog").length > 0) {
        return;
    }
    var layindex = layer.open({
        title: '图上标绘',
        type: 1,
        offset: ['10%', '80%'],
        skin: 'layer-mars-dialog',
        scrollbar: false,
        shade: 0,
        area: ['310px', '280px'], //宽高
        content: '<div id="drawdialog" style="width:100%;height:100%;"></div>',
        success: function (layero, index) {

            var drawControl = new draw({
                viewer: viewer
            });
        }
    })
}