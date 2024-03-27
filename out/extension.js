'use strict';
Object.defineProperty(exports, "__esModule", { value: true });

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/*
            "mapfile": "test.json", //название JSON файла, для которого строится конфигурация
            "controllers": "/home/graveric/vs/test/cont", // абсолютный путь до директории контроллеров
            "twigs": "/home/graveric/vs/test/twig", //абсолютный путь до директории твигов
            "twigController" : "/home/graveric/vs/test/dot/twig.php.dot", // образец твиг-контроллера
            "jsonController" : "/home/graveric/vs/test/dot/json.php.dot", //образец json-контроллера
            "js" : "/home/graveric/vs/test/js", //путь до директории js
            "dotjs": "/home/graveric/vs/test/dot/init.js.dot", //образец js
            "indexjs": "/home/graveric/vs/test/js/khe.js", //индексный инициализирующий файл js
            "initend": "init ends", //текст комментария, которым заканчивается блок импортов
            "initvar": "inits", //название переменной, в которой хранятся ссылки на инициализирующие функции
            "twig": "/home/graveric/vs/test/dot/twig.twig", //образец твига
            "variables" : {}, //переменные, которые необходимо заменить в формируемых из образцов файлов @v:
            "suffix": "Controller", //суффикс, который добавляется к контроллеру
            "affix": "admin.", //приставка к файлам js и twig
            "scssbase": "/home/graveric/vs/test/css/site.scss", // базовый файл scss с импортами
            "scssfix" : "admin", //приставка для scss файлов
            "scss": "/home/graveric/vs/test/css/" //директория с scss файлами
 */

function getOptions() {
	let params = {};
	const currentMap = path.basename(vscode.window.activeTextEditor.document.fileName);
	const options = vscode.workspace.getConfiguration('artopolot-controllers');
	if (options.sets) {
		for (let p in options.sets) {
			if (options.sets[p].mapfile && (options.sets[p].mapfile == currentMap)) {
				params = options.sets[p];
			}
		}
	}

	if (Object.keys(params).length == 0) {
		throw new Error('Конфигурация для данного JSON файла отсутствует');
	}

	if ((!params.controllers) || (!fs.existsSync(params.controllers))) {
		throw new Error('Путь контроллеров не задан или не существует');
	}

	if ((!params.twigs) || (!fs.existsSync(params.twigs))) {
		throw new Error('Путь шаблонов twig не задан или не существует');
	}

	if ((!params.twigController) || (!fs.existsSync(params.twigController))) {
		throw new Error('Образец twig контроллера не задан или не существует');
	}

	if ((!params.jsonController) || (!fs.existsSync(params.jsonController))) {
		throw new Error('Образец json контроллера не задан или не существует');
	}

	return params;

}

class Resolver {
	constructor() {
		this.options = getOptions();
		this.controllerName = null;
		this.controllerQuery = null;
		this.activeEditor = vscode.window.activeTextEditor;
		this.liner();
		this.vars = this.options.variables;
		this.affix = this.options.affix || "";
		this.scssfix = this.options.scssfix || "";
		this.suffix = this.options.suffix || "";
		this.ie = this.options.initend || "init end";	
		this.iv = this.options.initvar || "inits";	
	}

	liner() {		
		if (this.activeEditor) {
			const { text } = this.activeEditor.document.lineAt(this.activeEditor.selection.active.line);
			const m = text.match(/[\"|\']([a-zA-Z0-9]*)[\"|\'][\s]*:[\s]*[\"|\']([a-zA-Z0-9]*)[\"|\']/);
			if ((!m[1]) || (!m[2])) {
				throw new Error("Невозможно разобрать строку");
			}
			this.controllerName = m[2];
			this.controllerQuery = m[1];	
			
		} else {
			throw new Error('Нет активного редактора');
		}
	}

	wholeText() {
		if (this.activeEditor) {
			const d = this.activeEditor.document;
			return d.getText();
		}
	}

	replaceWhole(newText) {
		if (this.activeEditor) {
			this.activeEditor.edit(tb => {
				const d = this.activeEditor.document;
				const l = d.lineAt(d.lineCount - 1);
				const b = new vscode.Position(0,0);
				const f = new vscode.Position(d.lineCount - 1, l.text.length);
				const r = new vscode.Range(b,f);
				tb.replace(r, newText);
			});

		}		
	}
	
	sortJson() {
		const sj = (j)=>{
			const a = Object.keys(j).sort().reduce(
				(obj, key) => { 
				  obj[key] = j[key]; 
				  return obj;
				}, 
				{}
			);

			for (let i in a) {
				if (typeof a[i] === 'object' && a[i] !== null) {
					a[i] = sj(a[i]);
				}
			}
			
			return a;
		}
		
		
		const t = JSON.parse(this.wholeText());
		this.replaceWhole(JSON.stringify(sj(t),null,'\t'));
	
	}	

	makeJs() {
		if ((!this.options.js) || (!this.options.indexjs) || (!this.options.dotjs) ||
		(!fs.existsSync(this.options.js)) || (!fs.existsSync(this.options.indexjs)) || (!fs.existsSync(this.options.dotjs))) {
			throw new Error("Настройки JS не заданы или заданы неправильно");
		}
		fs.readFile(this.options.indexjs, (e, data)=>{
			if (e) {
				throw new Error(e);
			}
			const b = data.toString();				
			const r1 = new RegExp(`(.*?)(?=\\/\\*[\\s]*${this.ie}[\\s]*\\*\\/)`,"s");
			const r2 = new RegExp(`${this.iv}[\\s]*\\=[\\s]*\\{(.*)?(?=\\})`,"s");

			const m1 = b.match(r1);
			const m2 = b.match(r2);


			if (!m1[1]) {
				throw new Error("Стоп-фрагмент не найден");
			}

			if (!m2[1]) {
				throw new Error("Инициализирующая переменная не найдена");
			}
			const initb = m1[1];
			const initv = m2[1];

			const jn = `${this.affix}${this.controllerName}`.toLowerCase();
			const jf = path.join(this.options.js, `${jn}.js`);
			if (fs.existsSync(jf)) {
				throw new Error("Файл JS уже существует");
			}
			this.vars.initName = `init${this.controllerName}`;
			fs.readFile(this.options.dotjs, (e, data)=>{
				if (e) {
					throw new Error(e);
				}
				const n = this.replaceContent(data.toString());
				fs.writeFile(jf, n, (err) => {
					if (err) {
						throw new Error('Не удалось создать файл JS!');
					}
					this.show(jf);
					const nb = `${initb}import ${this.vars.initName} from "./${jn}";\n`;
					const nv = `\t${initv.trim()},\n\t"${this.controllerName.toLowerCase()}" : ${this.vars.initName}\n`;					
					let ni = b.replace(initb,nb).replace(initv,nv);
					/** пишем в индекс */
					fs.writeFile(this.options.indexjs, ni, (err) => {
						if (err) {
							throw new Error('Не удалось записать в индексный файл');
						}					
						this.show(this.options.indexjs);
					});

					/** дописываем в твиг, если он есть */
					let tw = path.join(this.options.twigs, `${this.affix}${this.controllerName.toLowerCase()}.html.twig`);
					if (fs.existsSync(tw)) {
						fs.readFile(tw, (e, data)=>{
							if (e) {
								throw new Error(e);
							}
							const nw = `{% set script='${this.controllerName.toLowerCase()}' %}\n${data.toString()}`;
							fs.writeFile(tw, nw, (err) => {
								if (err) {
									throw new Error('Не удалось записать в твиг');
								}					
								this.show(tw);
							})							
						});					
					}
				});					
			});			
			

		});		
	}

	makeCss() {
		if ((!this.options.scss) || (!this.options.scssbase) || (!fs.existsSync(this.options.scss)) || (!fs.existsSync(this.options.scssbase))) {
			throw new Error("Настройки SCSS не заданы или заданы неправильно");
		}
		let c = `${this.scssfix}${this.controllerName.toLowerCase()}`;
		let f = path.join(this.options.scss, `_${c}.scss`);
		if (fs.existsSync(f)) {
			throw new Error("Файл SCSS уже существует");
		}
		fs.writeFile(f, "", (err) => {
			if (err) {
				throw new Error('Не удалось создать scss файл!');
			}
			this.show(f);
			fs.appendFile(this.options.scssbase,`\n@import "${c}";`,'utf8',(err)=>{
				if (err) {
					throw new Error('Не удалось создать scss файл!');
				}
			});
		});	


	}

	twigController() {
		if(!this.options.twig) {
			throw new Error("Образец twig не задан");
		}
		this.vars.controllerName = this.controllerName+this.suffix;
		this.vars.twigName = `${this.affix}${this.controllerName.toLowerCase()}.html.twig`;		
		this.createPhp("twigController");		
		fs.readFile(this.options.twig, (e, data)=>{
			if (e) {
				throw new Error(e);
			}
			const n = this.replaceContent(data.toString());
			let f = path.join(this.options.twigs, `${this.vars.twigName}`);
			if (fs.existsSync(f)) {
				throw new Error('Файл шаблона уже существует, перезаписывать нельзя');
			}
			fs.writeFile(f, n, (err) => {
				if (err) {
					throw new Error('Не удалось создать файл контроллера!');
				}
		
				this.show(f);
			});			
		});		
	}

	jsonController() {
		this.vars.controllerName = this.controllerName+this.suffix;
		this.createPhp("jsonController");
	}

	createPhp(dot) {
		let d = this.options[dot];
		if (!d) {
			throw new Error("Тип операции некорректен");
		}

		
		fs.readFile(d, (e, data)=>{
			if (e) {
				throw new Error(e);
			}
			const n = this.replaceContent(data.toString());
			let f = path.join(this.options.controllers, `${this.vars.controllerName}.php`);
			if (fs.existsSync(f)) {
				throw new Error('Такой контроллер уже существует, перезаписывать контроллеры нельзя');
			}
			fs.writeFile(f, n, (err) => {
				if (err) {
					throw new Error('Не удалось создать файл контроллера!');
				}
		
				this.show(f);
			});			
		});
	}

	replaceContent(body) {
		let r = body;
		for (let p in this.vars) {
			r = r.replaceAll(`@v:${p}`,this.vars[p]);
		}
		return r;
	}



	show(t) {
		vscode.workspace.openTextDocument(t).then(
			document => vscode.window.showTextDocument(document,{preserveFocus: true, preview: false}));
	}
}


function actRes(act) {
	try {
		let res = new Resolver;
		res[act]();
	} 
	catch (e) {
		console.log(e.message);
		return vscode.window.showErrorMessage(e.message);
	}	
}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let twigC = vscode.commands.registerCommand('artopolot-controllers.createController', () => actRes("twigController"));
	let jsonC = vscode.commands.registerCommand('artopolot-controllers.createJsonController', () => actRes("jsonController"));
	let jsonS = vscode.commands.registerCommand('artopolot-controllers.sortJson', () => actRes("sortJson"));
	let cssS = vscode.commands.registerCommand('artopolot-controllers.makeCss', () => actRes("makeCss"));
	let jssS = vscode.commands.registerCommand('artopolot-controllers.makeJs', () => actRes("makeJs"));

	context.subscriptions.push(twigC);
	context.subscriptions.push(jsonC);
	context.subscriptions.push(jsonS);
	context.subscriptions.push(cssS);
	context.subscriptions.push(jssS);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
