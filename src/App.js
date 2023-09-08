import logo from './logo.svg';
import './App.css';

function App() {
    const items1 = [
        { id: 1, name: 'item 1' },
    ];
    const items2 = [
    ];
    return (
        <div className="flex flex-row w-full h-screen">
            <div className="flex flex-col flex-grow bg-green-200 h-full">
                {items1.map(item => (
                    <div key={item.id} className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48">
                        {item.name}
                    </div>
                ))}
            </div>
            <div className="flex flex-col flex-grow bg-blue-200 h-full">
                {items1.map(item => (
                    <div key={item.id}>
                        {item.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
