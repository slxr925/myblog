import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { HelpCircle } from 'lucide-react';

interface ShortcutItem {
    name: string;
    syntax: string;
    example?: string;
}

const shortcuts: ShortcutItem[] = [
    { name: '一级标题', syntax: '# 标题', example: '# 这是一级标题' },
    { name: '二级标题', syntax: '## 标题', example: '## 这是二级标题' },
    { name: '三级标题', syntax: '### 标题', example: '### 这是三级标题' },
    { name: '加粗', syntax: '**文本** 或 Ctrl+B', example: '**加粗文本**' },
    { name: '斜体', syntax: '*文本* 或 Ctrl+I', example: '*斜体文本*' },
    { name: '删除线', syntax: '~~文本~~', example: '~~删除的文本~~' },
    { name: '行内代码', syntax: '`代码`', example: '`const a = 1;`' },
    { name: '代码块', syntax: '```语言\n代码\n```', example: '```javascript\nconst hello = "world";\n```' },
    { name: '引用', syntax: '> 引用内容', example: '> 这是一段引用' },
    { name: '无序列表', syntax: '- 列表项 或 * 列表项', example: '- 第一项\n- 第二项' },
    { name: '有序列表', syntax: '1. 列表项', example: '1. 第一项\n2. 第二项' },
    { name: '链接', syntax: '[文本](URL)', example: '[百度](https://baidu.com)' },
    { name: '图片', syntax: '![描述](图片URL)', example: '![logo](https://example.com/logo.png)' },
    { name: '分割线', syntax: '--- 或 ***', example: '---' },
    { name: '表格', syntax: '| 列1 | 列2 |\n|-----|-----|\n| 内容 | 内容 |' },
    { name: '任务列表', syntax: '- [ ] 未完成\n- [x] 已完成' },
];

export function MarkdownShortcutsDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Markdown快捷键帮助"
                >
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Markdown 语法速查</DialogTitle>
                    <DialogDescription>
                        常用的Markdown语法和快捷键
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <div className="grid gap-4">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">{shortcut.name}</h3>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {shortcut.syntax}
                                    </code>
                                </div>
                                {shortcut.example && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">示例：</span>
                                        <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                                            {shortcut.example}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">💡 提示</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 可以使用 Ctrl+B 快速加粗选中文本</li>
                            <li>• 可以使用 Ctrl+I 快速斜体选中文本</li>
                            <li>• 支持直接粘贴图片上传（即将支持）</li>
                            <li>• 代码块支持语法高亮，记得指定语言名称</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
