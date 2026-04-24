import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { createAddress, fetchAddresses, updateProfile } from "../store/slices/authSlice";

const initialAddress = {
  label: "Home",
  full_name: "",
  phone_number: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  is_default: false,
};

export default function ProfilePage() {
  useDocumentTitle("Profile");
  const dispatch = useDispatch();
  const { user, addresses, addressesLoading, addressesError, profileSaving, error } =
    useSelector((state) => state.auth);
  const [profileForm, setProfileForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    avatar: "",
  });
  const [addressForm, setAddressForm] = useState(initialAddress);
  const [message, setMessage] = useState("");

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        avatar: user.avatar || "",
      });
      setAddressForm((current) => ({
        ...current,
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
      }));
    }
  }, [user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await dispatch(updateProfile(profileForm)).unwrap();
      setMessage("Profile updated successfully.");
    } catch {
      // Slice error will display.
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await dispatch(createAddress(addressForm)).unwrap();
      setAddressForm({
        ...initialAddress,
        full_name: user?.full_name || "",
        phone_number: user?.phone_number || "",
      });
      setMessage("Address saved successfully.");
    } catch {
      // Slice error will display.
    }
  };

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Profile</span>
          <h1>Manage your account details and saved delivery addresses.</h1>
        </div>
      </div>

      {message ? <p className="page-success">{message}</p> : null}
      {error || addressesError ? <p className="page-error">{error || addressesError}</p> : null}

      <div className="dashboard-grid">
        <form className="form-card" onSubmit={handleProfileSubmit}>
          <h3>Account details</h3>
          <div className="field-row">
            <Input
              label="First name"
              value={profileForm.first_name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, first_name: event.target.value }))
              }
            />
            <Input
              label="Last name"
              value={profileForm.last_name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, last_name: event.target.value }))
              }
            />
          </div>
          <div className="field-row">
            <Input
              label="Username"
              value={profileForm.username}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, username: event.target.value }))
              }
            />
            <Input
              label="Phone"
              value={profileForm.phone_number}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, phone_number: event.target.value }))
              }
            />
          </div>
          <Input
            label="Avatar URL"
            value={profileForm.avatar}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, avatar: event.target.value }))
            }
          />
          <Button type="submit" loading={profileSaving}>
            Save profile
          </Button>
        </form>

        <form className="form-card" onSubmit={handleAddressSubmit}>
          <h3>Add address</h3>
          <div className="field-row">
            <Input
              label="Label"
              value={addressForm.label}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, label: event.target.value }))
              }
            />
            <Input
              label="Full name"
              value={addressForm.full_name}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, full_name: event.target.value }))
              }
            />
          </div>
          <Input
            label="Phone number"
            value={addressForm.phone_number}
            onChange={(event) =>
              setAddressForm((current) => ({ ...current, phone_number: event.target.value }))
            }
          />
          <Input
            label="Address line 1"
            value={addressForm.line1}
            onChange={(event) =>
              setAddressForm((current) => ({ ...current, line1: event.target.value }))
            }
          />
          <Input
            label="Address line 2"
            value={addressForm.line2}
            onChange={(event) =>
              setAddressForm((current) => ({ ...current, line2: event.target.value }))
            }
          />
          <div className="field-row">
            <Input
              label="City"
              value={addressForm.city}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, city: event.target.value }))
              }
            />
            <Input
              label="State"
              value={addressForm.state}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, state: event.target.value }))
              }
            />
          </div>
          <div className="field-row">
            <Input
              label="Postal code"
              value={addressForm.postal_code}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, postal_code: event.target.value }))
              }
            />
            <Input
              label="Country"
              value={addressForm.country}
              onChange={(event) =>
                setAddressForm((current) => ({ ...current, country: event.target.value }))
              }
            />
          </div>
          <div className="profile-form-actions">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(event) =>
                  setAddressForm((current) => ({ ...current, is_default: event.target.checked }))
                }
              />
              <span>Set as default</span>
            </label>
            <Button type="submit" loading={addressesLoading}>
              Save address
            </Button>
          </div>
        </form>
      </div>

      <div className="panel-card profile-addresses-panel">
        <div className="panel-card-header profile-addresses-header">
          <h3>Saved addresses</h3>
          <span className="profile-address-count">{addresses.length} saved</span>
        </div>
        {addressesLoading ? <LoadingSpinner label="Loading addresses..." /> : null}
        {!addressesLoading && !addresses.length ? (
          <p className="profile-address-empty">No saved addresses yet.</p>
        ) : null}
        <div className="address-grid profile-address-grid">
          {addresses.map((address) => {
            const cityState = [address.city, address.state].filter(Boolean).join(", ");
            const cityStatePostal = [cityState, address.postal_code].filter(Boolean).join(" ");

            return (
              <div className="address-card profile-address-card" key={address.id}>
                <div className="address-card-top profile-address-card-top">
                  <strong>{address.label || "Address"}</strong>
                  {address.is_default ? <span className="default-pill">Default</span> : null}
                </div>
                <div className="profile-address-body">
                  <p className="profile-address-row">
                    <span className="profile-address-label">Name:</span>
                    <strong className="profile-address-value">{address.full_name || "Not set"}</strong>
                  </p>
                  <p className="profile-address-row">
                    <span className="profile-address-label">Phone:</span>
                    <span className="profile-address-value">{address.phone_number || "Not set"}</span>
                  </p>
                  <p className="profile-address-row">
                    <span className="profile-address-label">Line 1:</span>
                    <span className="profile-address-value">{address.line1 || "Not set"}</span>
                  </p>
                  {address.line2 ? (
                    <p className="profile-address-row">
                      <span className="profile-address-label">Line 2:</span>
                      <span className="profile-address-value">{address.line2}</span>
                    </p>
                  ) : null}
                  <p className="profile-address-row">
                    <span className="profile-address-label">City/State:</span>
                    <span className="profile-address-value">{cityStatePostal || "Not set"}</span>
                  </p>
                  <p className="profile-address-row">
                    <span className="profile-address-label">Country:</span>
                    <span className="profile-address-value">{address.country || "Not set"}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
