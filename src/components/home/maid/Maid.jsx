import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import '../../../styles/home/maidstyle/Maid.css';

// 将 Pixi 的 Ticker 注册给 Live2D，让 Live2D 的更新与 Pixi 的主循环同步
/*Pixi 的 Ticker 是一个基于 requestAnimationFrame 的“主循环驱动器”；
把 Live2D 绑定到这个驱动器上，
就能让模型的动画更新和场景渲染在同一帧节奏里运行，
保持一致的帧率、暂停/继续一致、性能也更可控
*/
Live2DModel.registerTicker(Ticker);

export default function Maid() {
	const containerRef = useRef(null);
	const appRef = useRef(null);
	const modelRef = useRef(null);
	// 缓存已加载的模型：key 为路径，value 为 Live2DModel 实例
	const preloadedRef = useRef(new Map());
	const [collapsed, setCollapsed] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	// 用户可调的清晰度（渲染分辨率倍率）。默认取设备像素比，最高 2x 以兼顾性能
	const [dpi, setDpi] = useState(3);
	// 用户可调的模型大小倍率（在 contain 结果基础上再缩放，不会超过容器）
	const [userScale, setUserScale] = useState(1);
	// 设置面板开关
	const [settingsOpen, setSettingsOpen] = useState(false);

	// 运行时选择的表情（仅用于当前模型，点击即应用，不参与合成）
	const [selectedExpression, setSelectedExpression] = useState('');
	// 装扮多选 + 动作/场景单选（参与合成表达式）
	const [selectedClothes, setSelectedClothes] = useState([]); // string[]
	const [selectedAction, setSelectedAction] = useState(''); // string
	const [selectedScene, setSelectedScene] = useState(''); // string
	// 面板打开状态：emotion | clothes | action | scene | ''
	const [openPanel, setOpenPanel] = useState('');

	// 当前模型 URL（用于解析表达式相对路径）与表达式 JSON 缓存
	const modelUrlRef = useRef('');
	const expJsonCacheRef = useRef(new Map()); // url -> json
	// 每帧强制写入目标参数，保证“持久显示”
	const compositeTargetRef = useRef(new Map()); // id -> value
	const enforcerOnRef = useRef(false);
	const enforcerFnRef = useRef(null);

	// 模型配置中心：集中管理每个模型的路径与分类资源
	const modelConfigs = useMemo(() => ({
		// 樱花狐（Bhuxian）
		sakuraFox: {
			label: '樱花狐',
			modelPath: '/live2dmodels/樱花狐/Bhuxian/Bhuxian.model3.json',
			expressions: {
				emotionList: [
					{ name: '爱心眼', file: '爱心眼.exp3.json', displayName: '爱心眼' },
					{ name: '害羞', file: '害羞.exp3.json', displayName: '害羞' },
					{ name: '黑脸', file: '黑脸.exp3.json', displayName: '黑脸' },
					{ name: '流泪', file: '流泪动画.exp3.json', displayName: '流泪' },
					{ name: '生气', file: '生气.exp3.json', displayName: '生气' },
					{ name: '星星眼', file: '星星眼.exp3.json', displayName: '星星眼' },
					{ name: '歪嘴L', file: '手动歪嘴L.exp3.json', displayName: '歪嘴L' },
					{ name: '歪嘴R', file: '手动歪嘴R.exp3.json', displayName: '歪嘴R' },
				],
				clothesList: [
					{ name: '小狐狸', file: '小狐狸.exp3.json', displayName: '小狐狸' },
					{ name: '眼镜', file: '眼镜.exp3.json', displayName: '眼镜' },
				],
				actionList: [
					{ name: '折扇闭', file: '折扇（闭）.exp3.json', displayName: '折扇闭' },
					{ name: '折扇开', file: '折扇开.exp3.json', displayName: '折扇开' },
				],
				sceneList: [
					{ name: '血迹', file: '血迹.exp3.json', displayName: '血迹' },
				],
			},
		},
		// 苹果狐（Apple Fox）
		appleFox: {
			label: '苹果狐',
			modelPath: '/live2dmodels/applefox/A苹果小狐狸/A苹果小狐狸.model3.json',
			expressions: {
				emotionList: [
					{ name: '爱心', file: '爱心.exp3.json', displayName: '爱心' },
					{ name: '生气', file: '生气.exp3.json', displayName: '生气' },
					{ name: '流泪', file: '流泪.exp3.json', displayName: '流泪' },
					{ name: '星星', file: '星星.exp3.json', displayName: '星星' },
					{ name: '脸红', file: '脸红.exp3.json', displayName: '脸红' },
					{ name: '脸黑', file: '脸黑.exp3.json', displayName: '脸黑' },
					{ name: '钱钱', file: '钱钱.exp3.json', displayName: '钱钱' },
				],
				clothesList: [
					{ name: '宠物', file: '宠物.exp3.json', displayName: '宠物' },
					{ name: '尾巴', file: '尾巴.exp3.json', displayName: '尾巴' },
					{ name: '睫毛', file: '睫毛.exp3.json', displayName: '睫毛' },
					{ name: '棕发', file: '棕发.exp3.json', displayName: '棕发' },
				],
				actionList: [
					{ name: '口红', file: '口红.exp3.json', displayName: '口红' },
					{ name: '手势', file: '手势.exp3.json', displayName: '手势' },
				],
				sceneList: [
					{ name: '背景1', file: '背景1.exp3.json', displayName: '背景1' },
					{ name: '背景2', file: '背景2.exp3.json', displayName: '背景2' },
					{ name: '背景3', file: '背景3.exp3.json', displayName: '背景3' },
				],
			},
		},
		// 团子鼠（粉鼠团子 / 团子出击）
		tuanziMouse: {
			label: '团子鼠',
			modelPath: '/live2dmodels/粉鼠团子/团子模型文件/团子出击/团子出击.model3.json',
			expressions: {
				emotionList: [
					{ name: '爱心眼', file: '爱心眼.exp3.json', displayName: '爱心眼' },
					{ name: '打米了', file: '打米了.exp3.json', displayName: '打米了' },
					{ name: '生气', file: '生气.exp3.json', displayName: '生气' },
					{ name: '脸红', file: '脸红.exp3.json', displayName: '脸红' },
					{ name: '流泪', file: '流泪.exp3.json', displayName: '流泪' },
					{ name: '流汗', file: '流汗.exp3.json', displayName: '流汗' },
					{ name: '晕', file: '晕.exp3.json', displayName: '晕' },
				],
				clothesList: [
					{ name: '抱枕', file: '抱枕.exp3.json', displayName: '抱枕' },
				],
				actionList: [
					{ name: '捏抱枕', file: '捏抱枕.exp3.json', displayName: '捏抱枕' },
					{ name: '唱歌手', file: '唱歌手.exp3.json', displayName: '唱歌手' },
				],
				sceneList: [],
			},
		},
		// 灵蝶狐（灵蝶之狐模型 / 芊芊）
		lingdieFox: {
			label: '灵蝶狐',
			modelPath: '/live2dmodels/灵蝶之狐模型/芊芊/芊芊.model3.json',
			expressions: {
				emotionList: [
					{ name: '星星眼', file: 'xingxingyan.exp3.json', displayName: '星星眼' },
					{ name: '脸红1', file: 'lianhong.exp3.json', displayName: '脸红1' },
					{ name: '脸红2', file: 'lianhong2.exp3.json', displayName: '脸红2' },
					{ name: '黑脸', file: 'heilian.exp3.json', displayName: '黑脸' },
					{ name: '流泪', file: 'yanlei.exp3.json', displayName: '流泪' },
					{ name: '问号1', file: 'wenhao.exp3.json', displayName: '问号1' },
					{ name: '问号2', file: 'wenhao2.exp3.json', displayName: '问号2' },
					{ name: '流汗', file: 'liuhan.exp3.json', displayName: '流汗' },
					{ name: '无语', file: 'wuyu.exp3.json', displayName: '无语' },
					{ name: '钱钱', file: 'qianyan.exp3.json', displayName: '钱钱' },
					{ name: '爱心眼', file: 'aixinyan.exp3.json', displayName: '爱心眼' },
					{ name: '轮回眼', file: 'lunhuiyan.exp3.json', displayName: '轮回眼' },
					{ name: '空白眼', file: 'kongbaiyan.exp3.json', displayName: '空白眼' },
					{ name: '星星', file: 'xingxing.exp3.json', displayName: '星星' },
					{ name: '生气', file: 'shengqi.exp3.json', displayName: '生气' },
				],
				clothesList: [
					{ name: '眼珠', file: 'yanzhu.exp3.json', displayName: '眼珠' },
					{ name: '长发', file: 'changfa.exp3.json', displayName: '长发' },
					{ name: '双马尾', file: 'shuangmawei.exp3.json', displayName: '双马尾' },
					{ name: '垂耳', file: 'chuier.exp3.json', displayName: '垂耳' },
					{ name: '镜子', file: 'jingzi.exp3.json', displayName: '镜子' },
					{ name: '狐狸', file: 'huli.exp3.json', displayName: '狐狸' },
					{ name: '笔记本1', file: 'bijiben.exp3.json', displayName: '笔记本1' },
					{ name: '笔记本2', file: 'bijiben2.exp3.json', displayName: '笔记本2' },
				],
				actionList: [
					{ name: '吐舌', file: 'tushe.exp3.json', displayName: '吐舌' },
					{ name: '嘟嘴', file: 'duzui.exp3.json', displayName: '嘟嘴' },
					{ name: '鼓嘴', file: 'guzui.exp3.json', displayName: '鼓嘴' },
					{ name: '打游戏', file: 'dayouxi.exp3.json', displayName: '打游戏' },
					{ name: '抱狐狸', file: 'baohuli.exp3.json', displayName: '抱狐狸' },
					{ name: '扇子', file: 'shanzi.exp3.json', displayName: '扇子' },
					{ name: '话筒', file: 'huatong.exp3.json', displayName: '话筒' },
					{ name: '比心', file: 'bixin.exp3.json', displayName: '比心' },
				],
				sceneList: [],
			},
		},
		// 书仙兔（小书仙青兔）
		shuxianRabbit: {
			label: '书仙兔',
			modelPath: '/live2dmodels/小书仙青兔/小书仙青兔/小书仙青兔.model3.json',
			expressions: {
				emotionList: [
					{ name: '星星', file: '星星.exp3.json', displayName: '星星' },
					{ name: '流汗', file: '流汗.exp3.json', displayName: '流汗' },
					{ name: '流汗2', file: '流汗2.exp3.json', displayName: '流汗2' },
					{ name: '爱心眼', file: '爱心眼.exp3.json', displayName: '爱心眼' },
					{ name: '生气', file: '生气.exp3.json', displayName: '生气' },
					{ name: '困困', file: '困困.exp3.json', displayName: '困困' },
					{ name: '惊讶', file: '惊讶.exp3.json', displayName: '惊讶' },
					{ name: '哭哭1', file: '哭哭1.exp3.json', displayName: '哭哭1' },
					{ name: '哭哭2', file: '哭哭2.exp3.json', displayName: '哭哭2' },
					{ name: '脸红', file: '脸红.exp3.json', displayName: '脸红' },
					{ name: '脸黑', file: '脸黑.exp3.json', displayName: '脸黑' },
					{ name: '钱钱', file: '钱钱.exp3.json', displayName: '钱钱' },
					{ name: '问号', file: '问号.exp3.json', displayName: '问号' },
					{ name: '黑眼', file: '黑眼.exp3.json', displayName: '黑眼' },
				],
				actionList: [
					{ name: '吐舌', file: '吐舌.exp3.json', displayName: '吐舌' },
					{ name: '唱歌', file: '唱歌.exp3.json', displayName: '唱歌' },
					{ name: '看书', file: '看书.exp3.json', displayName: '看书' },
					{ name: '看书写字', file: '看书写字.exp3.json', displayName: '看书写字' },
					{ name: '笔的点击按键', file: '笔的点击按键.exp3.json', displayName: '笔的点击按键' },
				],
				clothesList: [
					{ name: '变小', file: '变小.exp3.json', displayName: '变小' },
					{ name: '关耳朵', file: '关耳朵.exp3.json', displayName: '关耳朵' },
					{ name: '关飘带', file: '关飘带.exp3.json', displayName: '关飘带' },
					{ name: '扇子', file: '扇子.exp3.json', displayName: '扇子' },
				],
				sceneList: [],
			},
		},
	}), []);

	const DEFAULT_CONFIG_KEY = 'sakuraFox';
	const [currentModelKey, setCurrentModelKey] = useState(DEFAULT_CONFIG_KEY);

	const getCurrentConfig = () => modelConfigs[currentModelKey] || modelConfigs[DEFAULT_CONFIG_KEY];
	const DEFAULT_MODEL_PATH = getCurrentConfig().modelPath;

	// 直接从配置中心取分类列表
	const getCategorizedExpressions = useCallback(() => {
		const cfg = modelConfigs[currentModelKey] || modelConfigs[DEFAULT_CONFIG_KEY];
		return cfg.expressions;
	}, [currentModelKey, modelConfigs, DEFAULT_CONFIG_KEY]);


	// 尝试为模型启动待机动画：尽量匹配更宽松的“待机”分组
	const startIdle = async (model) => {
		if (!model) return false;
		let groups = [];
		try {
			const settings = model?.internalModel?.settings || model?.internalModel?._settings;
			const motions = settings?.motions || settings?.Motions || settings?._motions;
			if (motions && typeof motions === 'object') groups = Object.keys(motions);
		} catch {
			// 忽略读取失败
		}
		if (!groups.length) return false;
		// 1) 优先精确匹配常见命名
		const exactPref = ['Idle', 'idle', 'IDLE', '待机', '待机动画', '待機'];
		let group = exactPref.find((g) => groups.includes(g));
		// 2) 若无精确命中，使用模糊匹配（包含 idle/待 机 的关键词）
		if (!group) {
			group = groups.find((g) => /idle|待机|待機/i.test(g));
		}
		// 3) 若仍未找到，则不要强行播放“第一个分组”的一遍动作（很多是 Click/Tap），避免播放完就静止
		if (!group) return false;
		try {
			// 先清空当前动作再进入待机，避免叠加造成状态异常
			try { model?.internalModel?.motionManager?.stopAllMotions?.(); } catch (err) { void err; }
			// v0.4.0：直接调用 model.motion(group)；Idle 通常为循环动作
			await model.motion(group);
			return true;
		} catch (e) {
			console.warn('启动待机动画失败', e);
		}
		return false;
	};

	// 拖拽相关
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		// 扩大可拖拽范围：画布区域 + 控制条背景（设置面板不参与拖拽）
		const handleCanvas = el.querySelector('.maid-canvas-wrap');
		const handleBar = el.querySelector('.maid-controlbar');
		const handleEls = [handleCanvas, handleBar].filter(Boolean);

		let dragging = false;
		let startX = 0;
		let startY = 0;
		let startLeft = 0;
		let startTop = 0;

		const onPointerDown = (e) => {
			// 在控制条上仅当不是与控件交互时才允许拖拽
			if (e.target && typeof e.target.closest === 'function') {
				const inBar = e.target.closest('.maid-controlbar');
				const inSettings = e.target.closest('.maid-settings-panel');
				if (inBar || inSettings) {
					const interactive = e.target.closest('select, input, button');
					if (interactive) return;
				}
			}
			// 尽量捕获指针，避免在窗口外松手导致无法收到 pointerup
			if (typeof e.target.setPointerCapture === 'function' && e.pointerId != null) {
				e.target.setPointerCapture(e.pointerId);
			}
			dragging = true;
			const rect = el.getBoundingClientRect();
			startLeft = rect.left;
			startTop = rect.top;
			startX = e.clientX;
			startY = e.clientY;
			el.classList.add('maid-dragging');
		};

		const onPointerMove = (e) => {
			if (!dragging) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			const newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + dx));
			const newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + dy));
			el.style.left = `${newLeft}px`;
			el.style.top = `${newTop}px`;
			el.style.right = 'auto';
			el.style.bottom = 'auto';
		};

		const onPointerUp = () => {
			dragging = false;
			el.classList.remove('maid-dragging');
		};

		handleEls.forEach((h) => h.addEventListener('pointerdown', onPointerDown));
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);

		return () => {
			handleEls.forEach((h) => h.removeEventListener('pointerdown', onPointerDown));
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		};
	}, []);

	// 根据容器与当前倍率，对模型进行自适应摆放（contain + 左上对齐）
	const fitAndPlace = useCallback(() => {
		const app = appRef.current;
		const container = containerRef.current;
		const model = modelRef.current;
		if (!app || !container || !model || !app.renderer) return;
		const viewW = (app.renderer.screen && app.renderer.screen.width) || container.clientWidth || 300;
		const viewH = (app.renderer.screen && app.renderer.screen.height) || container.clientHeight || 400;
		const margin = 0.99; // 预留边距
		// 重置比例以获取原始大小
		model.scale.set(1, 1);
		const rawW = Math.max(1, model.width);
		const rawH = Math.max(1, model.height);
		const scaleByW = (viewW * margin) / rawW;
		const scaleByH = (viewH * margin) / rawH;
		const baseScale = Math.min(scaleByW, scaleByH);
		const desired = baseScale * (Number(userScale) || 1);
		const finalScale = Math.max(0.05, Math.min(baseScale, desired));
		model.scale.set(finalScale, finalScale);
		if (model.anchor && typeof model.anchor.set === 'function') {
			model.anchor.set(0, 0);
			model.x = 4; // 左侧留 4px 边距
			model.y = 0; // 顶部贴齐
		} else {
			model.x = 4;
			model.y = 0;
		}
	}, [userScale]);

	// 初始化 Pixi（仅运行一次）
	useEffect(() => {
		// 运行时保障：确保 Cubism4 Core 已加载
		if (typeof window !== 'undefined' && !window.Live2DCubismCore) {
			setError('缺少 Cubism4 Core：请将 live2dcubismcore.min.js 放到 public/live2dsrc/ 并在 index.html 中通过 <script src="/live2dsrc/live2dcubismcore.min.js"></script> 引入');
			setLoading(false);
			return;
		}

		const container = containerRef.current;
		if (!container) return;

		const app = new Application({
			resizeTo: container,
			backgroundAlpha: 0,
			antialias: true,
			// 让画布以高分屏分辨率渲染，显著提高清晰度
			autoDensity: true,
			resolution: dpi,
			// 避免亚像素渲染导致的轻微发糊
			roundPixels: true,
			powerPreference: 'high-performance',
		});

		appRef.current = app;
		container.querySelector('.maid-canvas-wrap').appendChild(app.view);

		// 初始化后加载默认模型
		try {
			void loadAndShowModel();
			setOpenPanel('');
		} catch (err) { void err; }


		const onResize = () => fitAndPlace();
		window.addEventListener('resize', onResize);

		// 在清理函数中使用当下捕获的缓存引用
		const cachedAtMount = preloadedRef.current;
		return () => {
			window.removeEventListener('resize', onResize);
			try {
				// 仅从舞台移除当前模型
				if (modelRef.current && app && app.stage) {
					try { app.stage.removeChild(modelRef.current); } catch (err) { void err; }
				}
			} catch (err) {
				console.warn('卸载时销毁模型失败', err);
			}
			// 关闭每帧强制器
			try { Ticker.shared.remove(enforcerFnRef.current); } catch { /* ignore */ }
			enforcerOnRef.current = false;
			compositeTargetRef.current = new Map();
			try {
				// 销毁所有缓存模型
				cachedAtMount.forEach((m) => {
					try {
						if (m && m.parent) m.parent.removeChild(m);
						m && m.destroy && m.destroy(true);
					} catch (err) { void err; }
				});
				app.destroy(true, { children: true, texture: true, baseTexture: true });
			} catch (err) {
				console.warn('卸载时销毁应用失败', err);
			}
			// 清空引用，避免异步回调使用到已销毁的 app
			appRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadAndShowModel = async (path) => {
		const cfgPath = path || getCurrentConfig().modelPath;
		const app = appRef.current;
		// 在严格模式的双挂载/卸载场景下，可能出现 app 已销毁或 stage 为空的情况
		if (!app || app.destroyed || !app.stage) return;
		setLoading(true);
		setError('');
		try {
			// 如有旧模型，先从舞台移除，并主动释放资源（避免内存占用累积）
			if (modelRef.current && app && app.stage) {
				try { modelRef.current.autoUpdate = false; } catch (err) { void err; }
				try { app.stage.removeChild(modelRef.current); } catch (err) { void err; }
				try {
					const oldPath = modelUrlRef.current;
					// 仅在切换到不同模型时销毁并移除缓存
					if (oldPath && oldPath !== cfgPath) {
						try { modelRef.current.destroy(true); } catch (err) { void err; }
						try { preloadedRef.current.delete(oldPath); } catch (err) { void err; }
					}
				} catch { /* ignore */ }
			}

			let model = preloadedRef.current.get(cfgPath);
			if (!model) {
				model = await Live2DModel.from(cfgPath, { autoInteract: false });
				model.interactive = true;
				if (model.anchor && typeof model.anchor.set === 'function') model.anchor.set(0, 0);
				// 初次加载：开启自动更新
				try { model.autoUpdate = true; } catch (err) { void err; }
				preloadedRef.current.set(cfgPath, model);
			}
			modelRef.current = model;
			modelUrlRef.current = cfgPath;
			// 同步当前模型键（若匹配到配置项）
			try {
				const found = Object.entries(modelConfigs).find(([, c]) => c.modelPath === cfgPath);
				if (found) setCurrentModelKey(found[0]);
			} catch { /* ignore */ }
			if (app && app.stage) {
				app.stage.addChild(model);
			} else {
				// 若 stage 不存在（可能因严格模式导致上一轮清理已销毁），中止后续流程
				return;
			}
			// 确保当前显示的模型恢复更新
			try { model.autoUpdate = true; } catch (err) { void err; }
			fitAndPlace();
			// 切换模型时，清空强制写参数器
			try { Ticker.shared.remove(enforcerFnRef.current); } catch { /* ignore */ }
			enforcerOnRef.current = false;
			compositeTargetRef.current = new Map();
			// 清空已缓存的表达式 JSON，避免跨模型缓存占用（按需可保留）
			try { expJsonCacheRef.current = new Map(); } catch { /* ignore */ }
			// 启动待机：智能匹配 Idle 分组，避免误触发一次性动作后静止
			await startIdle(model);
			// 初始化表情选择为预设表情列表的第一项，并重置动作分组
			try {
				const { emotionList } = getCategorizedExpressions();
				setSelectedExpression(emotionList[0]?.name || '');
				// 重置合成相关状态
				setSelectedClothes([]);
				setSelectedAction('');
				setSelectedScene('');
			} catch (err) { void err; }
		} catch (e) {
			console.error(e);
			setError('模型加载失败');
		} finally {
			setLoading(false);
		}
	};

	// 解析表达式 URL（相对 model3.json 目录）
	const resolveExpressionUrl = useCallback((file) => {
		const f = String(file || '').replace(/\\/g, '/');
		if (/^https?:\/\//i.test(f) || f.startsWith('/')) return f;
		const fallbackPath = (modelConfigs[currentModelKey] || modelConfigs[DEFAULT_CONFIG_KEY]).modelPath;
		const modelUrl = modelUrlRef.current || fallbackPath;
		const i = modelUrl.lastIndexOf('/');
		const base = i >= 0 ? modelUrl.slice(0, i + 1) : '/';
		return base + f;
	}, [currentModelKey, modelConfigs, DEFAULT_CONFIG_KEY]);

	// 获取表达式 JSON（带缓存）
	const getExpressionJson = useCallback(async (file) => {
		const url = resolveExpressionUrl(file);
		const cache = expJsonCacheRef.current;
		if (cache.has(url)) return cache.get(url);
		const res = await fetch(url, { cache: 'no-cache' });
		if (!res.ok) throw new Error(`加载表达式失败: ${url}`);
		const json = await res.json();
		cache.set(url, json);
		return json;
	}, [resolveExpressionUrl]);

	const applyCompositeFromSelections = useCallback(async () => {
		const model = modelRef.current;
		if (!model) return;
		const { clothesList, actionList, sceneList } = getCategorizedExpressions();
		// 收集需要加载的表达式
		const need = new Map(); // name -> {file, json}
		const pushNeed = (list) => list.forEach((it) => it && need.set(it.name, { file: it.file, json: null }));
		pushNeed(clothesList); pushNeed(actionList); pushNeed(sceneList);
		// 批量加载
		await Promise.all([...need.entries()].map(async ([, v]) => {
			try { v.json = await getExpressionJson(v.file); } catch { v.json = null; }
		}));
		// 计算各类别参数全集
		const getParamIds = (names) => {
			const s = new Set();
			names.forEach((n) => {
				const j = need.get(n)?.json;
				(j?.Parameters || j?.parameters || []).forEach((p) => { const id = p?.Id || p?.id; if (id) s.add(id); });
			});
			return s;
		};
		const clothesNames = clothesList.map(x => x.name);
		const actionNames = actionList.map(x => x.name);
		const sceneNames = sceneList.map(x => x.name);
		const clothesParams = getParamIds(clothesNames);
		const actionParams = getParamIds(actionNames);
		const sceneParams = getParamIds(sceneNames);

		// 目标参数值表
		const target = new Map(); // id -> value
		const setParamsFrom = () => (n) => {
			const j = need.get(n)?.json; if (!j) return;
			for (const p of (j.Parameters || j.parameters || [])) {
				const id = p?.Id || p?.id; if (!id) continue;
				const v = Number(p?.Value ?? p?.value ?? 0);
				target.set(id, v);
			}
		};

		// 装扮：选中的写入值，未选中的置 0
		selectedClothes.forEach(setParamsFrom());
		clothesParams.forEach((id) => { if (!target.has(id)) target.set(id, 0); });

		// 动作：仅保留所选动作参数，其它置 0
		if (selectedAction) setParamsFrom()(selectedAction);
		actionParams.forEach((id) => {
			if (!selectedAction || !target.has(id)) target.set(id, 0);
		});

		// 场景：仅保留所选场景参数，其它置 0
		if (selectedScene) setParamsFrom()(selectedScene);
		sceneParams.forEach((id) => {
			if (!selectedScene || !target.has(id)) target.set(id, 0);
		});

		// 更新目标表到 ref
		compositeTargetRef.current = target;

		// 没有任何可控参数：移除强制器并返回
		if (!target.size) {
			try { Ticker.shared.remove(enforcerFnRef.current); } catch { /* ignore */ }
			enforcerOnRef.current = false;
			return;
		}

		const composite = {
			Type: 'Live2D Expression',
			FadeInTime: 0.12,
			FadeOutTime: 0.1,
			Parameters: Array.from(target.entries()).map(([Id, Value]) => ({ Id, Value, Blend: 'Overwrite' })),
		};
		// 先尝试一次性应用表达式（如果底层支持，会由表达式系统维持）
		try { await model.expression(composite); } catch { /* ignore */ }

		// 启用每帧强制写入器，确保持久
		if (!enforcerOnRef.current) {
			const fn = () => {
				try {
					const m = modelRef.current; if (!m) return;
					const core = m?.internalModel?.coreModel; if (!core) return;
					for (const [id, v] of compositeTargetRef.current.entries()) {
						try {
							if (core.setParameterValueById) core.setParameterValueById(id, v);
							else if (core.setParameterById) core.setParameterById(id, v);
						} catch { /* ignore */ }
					}
				} catch { /* noop */ }
			};
			enforcerFnRef.current = fn;
			try { Ticker.shared.add(fn); } catch { /* ignore */ }
			enforcerOnRef.current = true;
		}
	}, [getCategorizedExpressions, getExpressionJson, selectedClothes, selectedAction, selectedScene]);

	// 监听选择变化，立即应用合成，避免一次延后一拍
	useEffect(() => {
		void applyCompositeFromSelections();
	}, [applyCompositeFromSelections, selectedClothes, selectedAction, selectedScene]);

	// 已移除基于 manifest 的自动切换/加载，仅在初始化时加载默认模型

	// 清晰度（渲染分辨率）动态调整
	useEffect(() => {
		const app = appRef.current;
		const container = containerRef.current;
		if (!app || !container || !app.renderer) return;
		const r = Math.max(1, Math.min(3, Number(dpi) || 1));
		try {
			if (app.renderer.resolution !== r) {
				app.renderer.resolution = r;
				// 触发内部缓冲区重建，保持 CSS 尺寸不变
				app.renderer.resize(container.clientWidth, container.clientHeight);
			}
		} catch (e) {
			console.warn('调整清晰度失败', e);
		}
	}, [dpi]);

	// 大小倍率调整时，按当前容器尺寸重新适配
	useEffect(() => {
		try { fitAndPlace(); } catch (e) { console.warn('根据大小倍率适配失败', e); }
	}, [fitAndPlace]);

	// 已移除切换模型逻辑（保留单模型）

	// 表情选择改为“选择即应用”，无需单独的应用函数

	// 展开/收起：收起时自动关闭设置面板
	const toggleCollapsed = () => {
		setCollapsed((prev) => {
			const next = !prev;
			if (next) {
				setSettingsOpen(false);
				setOpenPanel('');
			}
			return next;
		});
	};

	// 打开/关闭设置面板：若处于收起状态则先展开
	const toggleSettings = () => {
		setCollapsed(false);
		setSettingsOpen((v) => !v);
	};

	return (
	  <div
	    ref={containerRef}
	    className={`maid-widget maid-float${collapsed ? ' maid-collapsed' : ''}`}
	  >
	    <div className="maid-canvas-wrap" />

			{/* 设置面板：点击设置图标后出现，承载清晰度与大小控件 */}
			{settingsOpen && !collapsed && (
				<div id="maid-settings-panel" className="maid-settings-panel" role="dialog" aria-label="看板娘设置">
					<div className="maid-field">
						<label className="maid-controls-label" htmlFor="maidDpi">清晰度</label>
						<select
							id="maidDpi"
							className="maid-select"
							value={String(dpi)}
							onChange={(e) => setDpi(parseFloat(e.target.value))}
							title="调整渲染分辨率，数值越大越清晰但越耗性能"
						>
							<option value="1">1x</option>
							<option value="2">2x</option>
							<option value="3">3x</option>
						</select>
					</div>
					<div className="maid-field">
						<label className="maid-controls-label" htmlFor="maidScale">大小</label>
						<input
							id="maidScale"
							className="maid-range"
							type="range"
							min="0.5"
							max="1"
							step="0.01"
							value={userScale}
							onChange={(e) => setUserScale(parseFloat(e.target.value))}
							title="按最大适配大小(1x)的比例进行缩放，最小为1/2"
						/>
					</div>
				</div>
			)}

			{/* 底部控制条：表情/装扮/动作/场景 + 展开/设置 */}
			<div className="maid-controlbar">
				{(() => {
					const { emotionList, clothesList, actionList, sceneList } = getCategorizedExpressions();
					const mkBtn = (type, icon, title, disabled) => (
						<button
							className={`maid-iconbtn${openPanel === type ? ' maid-iconbtn-active' : ''}`}
							title={title}
							aria-label={title}
							aria-expanded={openPanel === type}
							disabled={disabled}
							onClick={() => setOpenPanel((p) => (p === type ? '' : type))}
						>
							<img src={icon} alt={title} />
						</button>
					);
					return (
						<>
							{mkBtn('emotion', '/icons/maid/emotion.svg', emotionList.length ? '表情' : '当前模型未提供表情', emotionList.length === 0)}
							{mkBtn('clothes', '/icons/maid/clothes.svg', clothesList.length ? '装扮' : '当前模型未提供装扮', clothesList.length === 0)}
							{mkBtn('action', '/icons/maid/action.svg', actionList.length ? '动作' : '当前模型未提供动作', actionList.length === 0)}
							{mkBtn('scene', '/icons/maid/sence.svg', sceneList.length ? '场景' : '当前模型未提供场景', sceneList.length === 0)}
						</>
					);
				})()}
				{/* 已移除独立“动作”控件，动作列表合并在表情面板中 */}
				<select
					className="maid-select"
					title="切换模型"
					value={currentModelKey}
					onChange={(e) => {
						const key = e.target.value;
						setOpenPanel('');
						try { setCurrentModelKey(key); } catch { /* ignore */ }
						const cfg = modelConfigs[key];
						if (cfg && cfg.modelPath) { void loadAndShowModel(cfg.modelPath); }
					}}
					style={{ marginLeft: 6 }}
				>
					{Object.entries(modelConfigs).map(([key, cfg]) => (
						<option key={key} value={key}>{cfg.label || key}</option>
					))}
				</select>
				<button
					className="maid-toggle"
					aria-pressed={collapsed}
					onClick={toggleCollapsed}
					title={collapsed ? '展开' : '收起'}
				>
					{collapsed ? '展开' : '收起'}
				</button>
				<button
					className={`maid-iconbtn${settingsOpen ? ' maid-iconbtn-active' : ''}`}
					onClick={toggleSettings}
					title="设置"
					aria-label="设置"
					aria-expanded={settingsOpen}
					aria-controls="maid-settings-panel"
				>
					<img src="/icons/maid/config.svg" alt="设置" />
				</button>

				{/* 单模型模式：无模型序号 */}
			</div>

			{(() => {
				if (collapsed || !openPanel) return null;
				const { emotionList, clothesList, actionList, sceneList } = getCategorizedExpressions();
				let list = [];
				let title = '';
				switch (openPanel) {
					case 'emotion':
						title = '表情'; list = emotionList; break;
					case 'clothes':
						title = '装扮'; list = clothesList; break;
					case 'action':
						title = '动作'; list = actionList; break;
					case 'scene':
						title = '场景'; list = sceneList; break;
					default: break;
				}
				if (!list.length) return null;
				return (
					<div className="maid-emotion-panel maid-emotion-panel-left" role="menu" aria-label={`选择${title}`}>
						<div className="maid-section-title">{title}</div>
						<ul className="maid-emotion-list" role="listbox" aria-activedescendant={selectedExpression || undefined}>
							{list.map((e) => {
								let isActive = false;
								switch (openPanel) {
									case 'clothes': isActive = selectedClothes.includes(e.name); break;
									case 'action': isActive = selectedAction === e.name; break;
									case 'scene': isActive = selectedScene === e.name; break;
									default: isActive = selectedExpression === e.name; break;
								}

								const handleClick = async () => {
									const model = modelRef.current;
									switch (openPanel) {
										case 'clothes': {
											setSelectedClothes((prev) => {
												const exist = prev.includes(e.name);
												const next = exist ? prev.filter(n => n !== e.name) : [...prev, e.name];
												return next;
											});
											// 合成将在 selections 变化的 effect 中自动触发
											break;
										}
										case 'action': {
											// 允许再次点击取消，恢复默认（空选择）
											if (selectedAction === e.name) {
												setSelectedAction('');
											} else {
												setSelectedAction(e.name);
											}
											// 合成将在 selections 变化的 effect 中自动触发
											setOpenPanel('');
											break;
										}
										case 'scene': {
											// 允许再次点击取消，恢复默认（空选择）
											if (selectedScene === e.name) {
												setSelectedScene('');
											} else {
												setSelectedScene(e.name);
											}
											// 合成将在 selections 变化的 effect 中自动触发
											setOpenPanel('');
											break;
										}
										default: {
											// 表情：即时应用，不参与合成
											setSelectedExpression(e.name);
											try {
												if (model) {
													// 优先按已注册的表达式“名称”应用（model3.json -> Expressions）
													await model.expression(e.name);
												}
											} catch {
												// 兼容：如名称不可用，则回退为加载 JSON 后直接应用
												try {
													if (model) {
														const json = await getExpressionJson(e.file);
														await model.expression(json);
													}
												} catch (err2) {
													console.warn('应用表情失败', err2);
												}
											}
											setOpenPanel('');
										}
									}
								};

								return (
									<li key={e.name} role="option" aria-selected={isActive}>
										<button
											type="button"
											className={`maid-emotion-item${isActive ? ' active' : ''}`}
											onClick={handleClick}
											title={`应用${title}：${e.displayName || e.name}`}
										>
											{e.displayName || e.name}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				);
			})()}

	    {loading && (
	    	<div className="maid-loading-overlay" aria-busy="true">
	    		<div className="maid-spinner" />
	    		<div className="maid-loading-text">模型加载中…</div>
	    	</div>
	    )}
	    {error && <div className="maid-error">{error}</div>}
	  </div>
	);
}
