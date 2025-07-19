function Delete() {
  return (
    <div className="relative size-6" data-name="delete">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="delete">
          <mask
            height="24"
            id="mask0_3_193"
            maskUnits="userSpaceOnUse"
            style={{ maskType: "alpha" }}
            width="24"
            x="0"
            y="0"
          >
            <rect
              fill="#D9D9D9"
              height="24"
              id="Bounding box"
              width="24"
            />
          </mask>
          <g mask="url(#mask0_3_193)">
            <path
              d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
              fill="white"
              id="delete_2"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function DeleteBtn({ onDelete, isVisible }) {
  return (
    <div
      className={`absolute right-0 top-0 h-16 w-11 flex items-center justify-center bg-[#ff3b30] cursor-pointer rounded-sm transition-transform duration-200 ease-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      onClick={onDelete}
    >
      <Delete />
    </div>
  );
}

export default DeleteBtn;