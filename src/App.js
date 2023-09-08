import './App.css';
import { useState } from 'react';

function App() {
    const items1 = [
        { id: 1, name: 'item 1' },
    ];
    const items2 = [
    ];
    const [draggingItem, setDraggingItem] = useState(undefined);
    const [mousePos, setMousePos] = useState(undefined);
    return (
        <div 
            className="flex flex-row w-full h-screen relative"
            onMouseMove={e => {
                // console.log('onMouseMove');
                // console.log(e);

                setMousePos({ x: e.clientX, y: e.clientY });
            }}
            >
            <div className="flex flex-col flex-grow bg-green-200 h-full">
                {items1.map(item => (
                    <div
                        key={item.id}
                        className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
                        onMouseDown={e => {
                            console.log('onMouseDown');
                            console.log(e);

                            // Starts dragging.
                            setDraggingItem(Object.assign({}, item));
                        }}
                    >
                        {item.name}
                    </div>
                ))}
            </div>
            <div className="flex flex-col flex-grow bg-blue-200 h-full">
                {items2.map(item => (
                    <div
                        key={item.id}
                        className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
                        onMouseDown={e => {
                            //todo: this should be on all draggables!
                            console.log('onMouseDown');
                            console.log(e);
                        }}
                    >
                        {item.name}
                    </div>
                ))}
            </div>

            {draggingItem &&
                <div
                    className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
                    style={{
                        position: 'absolute',
                        top: mousePos?.y,
                        left: mousePos?.x,
                        right: mousePos?.x + 10,
                        bottom: mousePos?.y + 10,
                    }}
                    >
                    {draggingItem.name}
                </div>
            }
        </div>
    );
}

export default App;
