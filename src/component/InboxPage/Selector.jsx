import { selectOptions } from "../../ui/classes"
import { emptyFn } from "../../js/types"

export const allPhones = "Empty"

export const MessageFilterEnum = {
  all: "All messages",
  received: "Received messages",
  sent: "Sent messages",
}

const SelectDirection = ({ onMessageFilterChange = emptyFn }) => (
  <select onChange={e => onMessageFilterChange(e.target.value)}>
    <option className={selectOptions} value={MessageFilterEnum.received}>
      {MessageFilterEnum.received}
    </option>
    <option className={selectOptions} value={MessageFilterEnum.sent}>
      {MessageFilterEnum.sent}
    </option>
    <option className={selectOptions} value={MessageFilterEnum.all}>
      {MessageFilterEnum.all}
    </option>
  </select>
)

const Input = ({
  loading = true,
  value = "",
  disabled = false,
}) => {
  if (loading) return <input type="text" className="w-full animate-pulse" value="Loading..." disabled />
  return (
    <input
      type="text"
      className="w-full"
      value={value}
      disabled={disabled}
    />
  )
}

export const Selector = ({
  phoneNumber = allPhones,
  loading = true,
  onMessageFilterChange = emptyFn,
}) => (
  <div className="flex gap-2 mb-2">
    {loading ? (
      <div className="w-full animate-pulse h-10 bg-gray-200" />
    ) : (
      <div className={`relative`}>
      <label className="w-full flex">
        <Input
          loading={loading}
          value={phoneNumber}
          disabled={true}
        />
      </label>
    </div>
    )}
    <SelectDirection onMessageFilterChange={onMessageFilterChange} />
  </div>
)
