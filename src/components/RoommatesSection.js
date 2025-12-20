
import React from 'react';
import './rooma.css';
const RoommatesSection = ({ 
  roommates, 
  newRoommate, 
  setNewRoommate, 
  onAddRoommate, 
  onRemoveRoommate 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddRoommate();
  };

  return (
    <div className="section-container">
      <h2>Manage Roommates</h2>
      
      <form className="add-roommate-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="New roommate name"
          value={newRoommate}
          onChange={(e) => setNewRoommate(e.target.value)}
          required
        />
        <button 
          type="submit"
          className="add-button"
        >
          Add
        </button>
      </form>
      
      <div className="roommate-list">
        {roommates.length === 0 ? (
          <div className="empty-state">
            <p>No roommates added yet. Add your first roommate above!</p>
            <p className="hint">You need to add roommates before you can track expenses.</p>
          </div>
        ) : (
          roommates.map((roommate) => (
            <div 
              key={roommate.id}
              className="roommate-card"
            >
              <div className="avatar-with-name">
                <div className="avatar">
                  {roommate.name.charAt(0).toUpperCase()}
                </div>
                <span>{roommate.name}</span>
              </div>
              <button 
                type="button"
                className="remove-button"
                onClick={() => onRemoveRoommate(roommate.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoommatesSection;