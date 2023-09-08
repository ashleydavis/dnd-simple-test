import './App.css';
import { useEffect, useState, createContext, useContext } from 'react';

const DragContext = createContext(null);


export function DragContextProvider({ children }) {

    const [draggingItem, setDraggingItem] = useState(undefined);
    const [mousePos, setMousePos] = useState(undefined);

    function onMouseMove(event) {
        setMousePos({ x: event.clientX, y: event.clientY });

        if (draggingItem) {
            console.log('draggingItem');

            //todo: are we over something?
        }
    };

    useEffect(() => {
        //
        // Handles mouse move on the window.
        //
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
        };

    }, []);

    const value = {
        draggingItem, 
        setDraggingItem,
        mousePos,
        setMousePos,
    };

    return (
        <DragContext.Provider
            value={value}
            >
            {children}
        </DragContext.Provider>
    );
}

function useDraggable() {
    return useContext(DragContext);
}

function Item({ item }) {

    const { setDraggingItem } = useDraggable();

    return (
        <div
            className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
            onMouseDown={e => {
                console.log('onMouseDown');
                console.log(e);

                // Starts dragging.
                setDraggingItem(Object.assign({}, item)); //todo: move this into draggable.
            }}
            >
            {item.name}
        </div>
    );
}

function App() {

    const { draggingItem, mousePos } = useDraggable();

    const items1 = [
        { id: 1, name: 'item 1' },
    ];
    const items2 = [
        { id: 2, name: 'item 2' },
    ];
    return (
        <div
            className="flex flex-row w-full h-screen relative"
            >
            <div className="flex flex-col flex-grow bg-green-200 h-full">
                {items1.map(item => (
                    <Item key={item.id} item={item} />
                ))}
            </div>

            <div className="flex flex-col flex-grow bg-blue-200 h-full">
                {items2.map(item => (
                    <Item key={item.id} item={item} />
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
