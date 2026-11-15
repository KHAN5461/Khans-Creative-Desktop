import React, { useState, useRef, useEffect } from 'react';

interface TerminalProps {
    onCommand?: (command: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ onCommand }) => {
    const [history, setHistory] = useState([
        { type: 'output', text: 'Welcome to KhanOS v1.0.0' },
        { type: 'output', text: "Type 'help' for available commands." }
    ]);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newHistory = [...history, { type: 'input', text: input }];
            
            let output = "";
            switch(cmd) {
                case 'help': output = "Available commands: help, about, projects, clear, whoami, contact, error"; break;
                case 'about': output = "Khan | Creative Dev | Building things that live on the internet."; break;
                case 'projects': output = "Opening projects... (Check the Projects app)"; break;
                case 'whoami': output = "guest@portfolio-v1"; break;
                case 'contact': output = "Email me at hello@khan.dev"; break;
                case 'clear': setHistory([]); setInput(""); return;
                case 'error': 
                    output = "CRITICAL ERROR: SYSTEM INSTABILITY DETECTED...";
                    if (onCommand) onCommand('error'); 
                    break;
                case '': output = ""; break;
                default: output = `Command not found: ${cmd}`;
            }
            
            if (output) newHistory.push({ type: 'output', text: output });
            setHistory(newHistory);
            setInput("");
        }
    };

    return (
        <div className="h-full flex flex-col font-mono text-xs bg-[#1e1e1e] text-neutral-300 p-2">
            <div className="flex-1 overflow-y-auto space-y-1 p-2">
                {history.map((line, i) => (
                    <div key={i} className={line.type === 'input' ? "text-neutral-100" : "text-neutral-400"}>
                        {line.type === 'input' ? <span className="text-green-500 mr-2">➜ ~</span> : null}
                        {line.text}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="flex items-center gap-2 p-2 border-t border-neutral-700">
                <span className="text-green-500">➜</span>
                <span className="text-blue-500">~</span>
                <input 
                    className="bg-transparent border-none outline-none flex-1 text-neutral-100"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    autoFocus
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

export default Terminal;
