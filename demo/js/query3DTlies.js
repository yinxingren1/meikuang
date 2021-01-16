var query3Dtiles = {
    //
    handler: null,
    viewer: null,
    selmtile: [],
    flag: false,
    n_tile: null,
    start() {
        var this_ = this;
        if (this_.flag) {
            this_.viewer.flyTo(this_.n_tile);
            return
        }
        this_.flag = true;
        this_.viewer = viewer;
        this_.n_tile = loadmapProvider.load3DTiles(viewer, {
            url: 'http://resource.dvgis.cn/data/3dtiles/ljz/tileset.json',
            style: {
                color: {
                    conditions: [
                        ['${Height} >= 300', 'rgba(45, 0, 75, 0.5)'],
                        ['${Height} >= 200', 'rgb(102, 71, 151)'],
                        ['${Height} >= 100', 'rgb(170, 162, 204)'],
                        ['${Height} >= 50', 'rgb(224, 226, 238)'],
                        ['${Height} >= 25', 'rgb(252, 230, 200)'],
                        ['${Height} >= 10', 'rgb(248, 176, 87)'],
                        ['${Height} >= 5', 'rgb(198, 106, 11)'],
                        ['true', 'rgb(127, 59, 8)']
                    ]
                }
            },
            height: 0,
            isZoomTo: true
        });
        this_.n_tile.readyPromise.then(function () {
            this_.lclick([this_.n_tile]);
        });

    },
    lclick(sel3Dtiles) {
        var this_ = this;
        var sel3Dtiles = sel3Dtiles;
        if (this.handler) {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (movement) {
            var fea = this_.viewer.scene.pick(movement.position);
            if (fea) {
                if (sel3Dtiles != null) {
                    var feature3dtiles = fea.primitive || fea.tileset;
                    for (var i = 0; i < sel3Dtiles.length; i++) {
                        if (sel3Dtiles[i] == feature3dtiles) {
                            // if (fea && fea.id) {
                            //     if (this_.selmtile.length > 0) {
                            //         this_.selmtile[0].id.polygon.material = this_.selmtile[1];
                            //     }
                            //     this_.selmtile = [fea, fea.id.polygon.material];
                            //     fea.id.polygon.material = new Cesium.Color(0, 1, 1, 0.3) //Cesium.Color.AQUA
                            // }

                            if (fea instanceof Cesium.Cesium3DTileFeature) {

                                if (this_.selmtile.length > 0) {
                                    this_.selmtile[0].color = this_.selmtile[1];
                                }
                                this_.selmtile = [fea, fea.color];

                                fea.color = Cesium.Color.RED;
                            }
                            var property = {
                                'id': fea.getProperty('id'),
                                'height': fea.getProperty('Height')
                            };
                            var point = this_.getCurrentMousePosition(viewer.scene, movement.position);
                            this_.showpopup(point, property);
                        }
                    }

                }
            } else {
                fea.id.polygon.material = new Cesium.Color(0, 1, 1, 0.3)
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    closeLclick() {
        if (this.handler) {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    },
    //屏幕坐标转
    getCurrentMousePosition(scene, position) {
        var cartesian;
        //在模型上提取坐标  
        var pickedObject = scene.pick(position);
        if (scene.pickPositionSupported && Cesium.defined(pickedObject)) { //pickPositionSupported :判断是否支持深度拾取,不支持时无法进行鼠标交互绘制
            var cartesian = scene.pickPosition(position);
            if (Cesium.defined(cartesian)) {
                return cartesian;

            }
        }
        //提取鼠标点的地理坐标 
        if (scene.mode === Cesium.SceneMode.SCENE3D) {
            //三维模式下
            var pickRay = scene.camera.getPickRay(position);
            cartesian = scene.globe.pick(pickRay, scene);
        } else {
            //二维模式下
            cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
        }
        return cartesian;
    },
    //显示弹出框
    showpopup(positions, props) {
        var text = '建筑编号：' + props.id + '<br/>高度：' + props.height;
        tooltip.viewer = this.viewer;
        tooltip.closeAll();
        tooltip.add(viewer, {
            geometry: positions,
            content: {
                header: "信息",
                content: `
              <div><span>建筑编号：</span><span>${props.id}</span></div>
              <div><span>高度：</span><span>${props.height}</span></div>
              `,
            }
        });
    }
};
$("#menu-query").on("click", function () {
    query3Dtiles.start();
});
//信息框
var tooltip = {
    viewer: viewer,
    id: 0,
    ctnList: {},
    add(viewer, conf) {
        var _this = this;
        var geometry = conf.geometry; //弹窗挂载的位置
        var id = "popup_" + (((1 + Math.random()) * 0x10000) | 0).toString(16) + _this.id++;
        var ctn = document.createElement('div');
        ctn.className = "bx-popup-ctn";
        ctn.id = id;
        document.getElementById(_this.viewer.container.id).appendChild(ctn);
        //测试弹窗内容
        var testConfig = conf.content;
        ctn.innerHTML = _this.createHtml(testConfig.header, testConfig.content);
        _this.ctnList[id] = [geometry, ctn];
        _this.render();
        if (!_this.eventListener) {
            _this.eventListener = function (clock) {
                _this.render();
            };
            _this.viewer.clock.onTick.addEventListener(_this.eventListener)
        }
    },
    render() {
        var _this = this;
        for (var c in _this.ctnList) {
            var position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(_this.viewer.scene, _this.ctnList[c][0]);
            if (position && position.x && position.y) {
                if (Math.abs(position.x) > (window.innerWidth * 2) || Math.abs(position.y) > (window.innerHeight * 2)) {
                    _this.ctnList[c][1].style.display = "none";
                } else {
                    _this.ctnList[c][1].style.display = "";
                    _this.ctnList[c][1].style.left = position.x + "px";
                    _this.ctnList[c][1].style.top = position.y + "px";
                }
            }
        }
    },
    createHtml(header, content) {
        if (this.html) {
            return this.html(header, content);
        } else {
            var html = `
            <div class="divpoint-wrap">
            <div class="divpoint-border">
            <div class="divpoint-center">
            <div class="bx-popup-header-ctn">
            ${header}
            </div>
            <div class="bx-popup-content-ctn" >
            <div class="bx-popup-content" >
            ${content}
            </div>
            </div>
            </div>
            </div>
            </div>
            <div class="directional"></div>
            `;
            return html;
        }
    },
    close(e) {
        e.remove();
        delete this.ctnList[e.id];
        if (Object.keys(this.ctnList).length == 0) {
            this.viewer.clock.onTick.removeEventListener(this.eventListener);
            this.eventListener = null;
        }
    },
    closeAll(e) {
        for (var o in this.ctnList) {
            this.ctnList[o][1].remove();
        }
        this.ctnList = {};
        if (this.eventListener)
            this.viewer.clock.onTick.removeEventListener(this.eventListener);
        this.eventListener = null;
    }
}
//加载3dtiles/kml，geojson
var loadmapProvider = {
    _kmllist: [],
    _geojsonlist: [],
    _3dtileslist: [],
    //加载模型
    load3DTiles(viewer, opts) {
        var this_ = this;
        var opts = opts;
        var viewer = viewer;

        //加载3DTiles数据
        var tiles = new Cesium.Cesium3DTileset({
            url: opts.url
        })
        //设置tiles风格
        tiles.style = new Cesium.Cesium3DTileStyle(opts.style);
        //获取生成的3维对象
        var target = viewer.scene.primitives.add(tiles);

        target.readyPromise.then(function (target) {
            var heightOffset = opts.height;  //3dtiles的高度设置
            var boundingSphere = target.boundingSphere;
            var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
            var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
            var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
            var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
            target.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
            //viewer.zoomTo(target, new Cesium.HeadingPitchRange(0.5, -0.2, target.boundingSphere.radius * 1.0));
        });

        //是否缩放到加载的图层
        if (opts.isZoomTo) {
            viewer.zoomTo(target);
        }
        this_._3dtileslist.push(tiles);
        return tiles;
    },
    //加载kml
    loadKML(viewer, opts) {
        var this_ = this;
        var opts = opts;
        var viewer = viewer;
        // 加载kml文件
        var kmlOptions = {
            camera: viewer.scene.camera,
            canvas: viewer.scene.canvas,
            clampToGround: true
        };
        var kmlmx = Cesium.KmlDataSource.load(opts.url, kmlOptions);
        viewer.dataSources.add(kmlmx);
        //是否缩放到加载的图层
        if (opts.isZoomTo) {
            viewer.zoomTo(kmlmx);
        }
        this_._kmllist.push(kmlmx);
        return kmlmx;
    },
    loadGeojson(viewer, opts) {
        var this_ = this;
        var opts = opts;
        var viewer = viewer;
        var dataSource = Cesium.GeoJsonDataSource.load(opts.url, {
            clampToGround: opts.clampToGround
        });
        dataSource.then(function (dataSource) {
            var dataSource_ = dataSource

            viewer.dataSources.add(dataSource_);
            var entities = dataSource_.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (opts.styleOpts) {
                    if (entity.polygon) {
                        Object.assign(entity.polygon, opts.styleOpts)
                    } else if (entity.billboard) {
                        Object.assign(entity.billboard, opts.styleOpts)
                    } else if (entity.point) {
                        Object.assign(entity.point, opts.styleOpts)
                    } else if (entity.polyline) {
                        Object.assign(entity.polyline, opts.styleOpts)
                    }
                }
            }
            this_._geojsonlist.push(dataSource_);
            if (opts.isZoomTo) {
                viewer.flyTo(entities);
            }
        })
        return dataSource;
    }
}