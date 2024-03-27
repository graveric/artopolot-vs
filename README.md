# Artopolot Components

## Описание

Создаёт новый темплейт из карты контролеров Artopolot и автоматически прописывает все связи. Может создавать контроллер JSON или контроллер TWIG (с созданием TWIG шаблона). Дополнительно можно создать пустой SCSS файл (с прописыванием импорта), связанный с новым контроллером и набор JS (с прописыванием связей)

## Шаблонные файлы
Все файлы шаблонов (php контроллеры, twig, js) включают в себя единственный элемент синтаксиса `@v:имя_переменной`, которое заменяется на нужную переменную из свойства ***vars*** объекта ***Resolver***. Если такой переменной нет, то шаблон остаётся (если будет время, в будущем это поведение переделаю).

## Настройки

Все настройки хранятся в объекте **artopolot-controllers.sets**, структура которого описана ниже. Набор настроек прописывается для каждого конкретного файла-карты JSON. (Карты, не описанные в настройках, не обрабатываются.)

**artopolot-controllers-sets** включает в себя следующие свойства.

* `mapfile`: Название файла-карты json, для которого строится конфигурация (без пути)
* `controllers`: абсолютный путь до директории, в которую будут сохраняться готовые контроллеры
* `twigs`: абсолютный путь до директории, в которую будут сохраняться шаблоны TWIG
* `twigController`: образец TWIG контроллера (абсолютный путь)
* `jsonController`: образец JSON контроллера (абсолютный путь)
* `js`: абсолютный путь до директории, куда будут сохраняться JS файлы
* `dotjs`: образец файла js
* `indexjs`: индексный (инициализирующий) файл js
* `initend`: блок импортов в индексном файле должен заканчиваться комментарием с этим текстом
* `initvar`: название переменной в индексном файле, в которой хранятся ссылки на инициализирующие функции
* `twig`: образец шаблона TWIG (абсолютный путь)
* `variables`: {}, предустановленные переменные, которые необходимо заменить в формируемых из образцов файлов 
* `suffix`: суффикс, который добавляется к контроллеру
* `affix`: приставка к файлам js и twig
* `scssbase`: базовый файл scss с импортами (абсолютный путь)
* `scssfix` : приставка для scss файлов
* `scss`: директория с scss файлами (абсолютный путь)

## Release Notes

### 1.0.0

Начальный локальный релиз, готовый для публикации в папке VSCode