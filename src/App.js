import './App.css';
import { useEffect, useState, createContext, useContext, useRef, useCallback } from 'react';

const DragContext = createContext(null);


export function DragContextProvider({ children }) {

    const [draggingItem, setDraggingItem] = useState(undefined);
    const [mousePos, setMousePos] = useState(undefined);
    const droppableRefs = useRef({}); 

    useEffect(() => {
        if (!draggingItem) {
            return;
        }

        function onMouseMove(event) {
            setMousePos({ x: event.clientX, y: event.clientY });
    
            if (draggingItem) {
                if (droppableRefs.current) {
                    for (const [id, droppable] of Object.entries(droppableRefs.current)) {
                        const droppableRect = droppable.getBoundingClientRect();

                        //TODO: closest corner would be better.

                        // If the mouse position is within the droppable area.
                        if (event.clientX >= droppableRect.left && event.clientX <= droppableRect.right &&
                            event.clientY >= droppableRect.top && event.clientY <= droppableRect.bottom) {
                            console.log('hit droppable:');
                            console.log(id);
                        }
                    }
                }
            }
        }
        
        function onMouseUp(event) {
            setDraggingItem(undefined);

            //todo: trigger drop event.
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

    }, [draggingItem]);

    function setDroppableRef(id, ref) {
        // console.log('setDroppableRef'); 
        // console.log(id);
        // console.log(ref);

        droppableRefs.current = {
            ...droppableRefs.current,
            [id]: ref,
        };
    }

    const value = {
        draggingItem, 
        setDraggingItem,
        setDroppableRef,
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

    const { setDraggingItem, setDroppableRef } = useDraggable();

    return (
        <div
            ref={el => setDroppableRef(item.id, el)}
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

function DragOverlay() {
    const { draggingItem, mousePos } = useDraggable();

    return draggingItem 
        && <div
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
        || undefined;
}

function App() {


    const items1 = [
        { id: 1, name: 'item 1' },
    ];
    const items2 = [
        { id: 2, name: 'item 2' },
    ];
    return (
        <DragContextProvider>
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

                <DragOverlay />
            </div>
        </DragContextProvider>
    );
}

export default App;
