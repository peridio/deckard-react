import React from 'react';
import { Modal } from './Modal';

interface KeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  examplesHidden: boolean;
}

const KeyboardModal: React.FC<KeyboardModalProps> = ({
  isOpen,
  onClose,
  examplesHidden,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard shortcuts"
      size="lg"
    >
      <div className="keyboard-shortcuts-grid">
        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Navigation</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>J</kbd>
              </div>
              <div className="keyboard-description">Next property</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>K</kbd>
              </div>
              <div className="keyboard-description">Previous property</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>H</kbd>
              </div>
              <div className="keyboard-description">Collapse property</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>L</kbd>
              </div>
              <div className="keyboard-description">Expand property</div>
            </div>
          </div>
        </div>

        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Search</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>S</kbd>
              </div>
              <div className="keyboard-description">Focus search box</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>Esc</kbd>
              </div>
              <div className="keyboard-description">Clear search</div>
            </div>
          </div>
        </div>

        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Expand & collapse</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>⌘</kbd> <kbd>E</kbd>
              </div>
              <div className="keyboard-description">Expand all properties</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>⌘</kbd> <kbd>Shift</kbd> <kbd>E</kbd>
              </div>
              <div className="keyboard-description">
                Collapse all properties
              </div>
            </div>
          </div>
        </div>

        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Display</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>E</kbd>
              </div>
              <div className="keyboard-description">
                {examplesHidden ? 'Show examples' : 'Hide examples'}
              </div>
            </div>
          </div>
        </div>

        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Tooltips</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>Ctrl</kbd>
              </div>
              <div className="keyboard-description">Show all tooltips</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>T</kbd>
              </div>
              <div className="keyboard-description">Pin/unpin tooltip</div>
            </div>
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>Esc</kbd>
              </div>
              <div className="keyboard-description">Close tooltips</div>
            </div>
          </div>
        </div>

        <div className="keyboard-section">
          <h4 className="keyboard-section-title">Help</h4>
          <div className="keyboard-shortcuts">
            <div className="keyboard-shortcut">
              <div className="keyboard-keys">
                <kbd>Shift</kbd> <kbd>?</kbd>
              </div>
              <div className="keyboard-description">
                Show keyboard shortcuts
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardModal;
