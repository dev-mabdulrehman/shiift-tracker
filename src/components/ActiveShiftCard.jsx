import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// src/components/ActiveShiftCard.jsx
const ActiveShiftCard = ({ shift, canClockOut }) => {
    const updateStatus = async (newStatus) => {
        const docRef = doc(db, "shifts", shift.id);
        await updateDoc(docRef, { status: newStatus });
    };

    return (
        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold">Active Shift: {shift.site}</h3>
            <p className="text-indigo-200 mb-4">Current Status: <span className="uppercase font-bold">{shift.status}</span></p>

            <div className="flex gap-2">
                {shift.status === 'pending' && (
                    <button onClick={() => updateStatus('on site')} className="bg-green-500 px-4 py-2 rounded-lg font-bold">
                        I am On Site
                    </button>
                )}

                {shift.status === 'on site' && (
                    <button disabled={!canClockOut} onClick={() => updateStatus('completed')} className="bg-orange-500 px-4 py-2 rounded-lg font-bold">
                        I have Left Site
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActiveShiftCard;